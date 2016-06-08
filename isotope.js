/**
 * Isotope Node.js Library
 * Provides a Node.js interface between the Isotope emulation chip
 * and the local system, as well as a number of useful command
 * wrappers.
 *
 * Multidrop integration added 5/2016
 * Kevin Chen, Spectrum Comm. Inc.
 *
 * Copyright © Benjamin Pannell 2014
 */

var SerialPort = require('serialport').SerialPort,
	EventEmitter = require('events').EventEmitter,
	util = require('util');

var Keyboard = require('./helpers/Keyboard'),
	Mouse = require('./helpers/Mouse');

module.exports = Isotope;

function Isotope(device) {
	this.open = false;
	this.buffer = [];
	this.maxRate = 500;

	this.lastWrite = 0;
	this.writeInterval = null;

	// Specifies which Teensy should process a fired command


	// Note: with the Teensy 2.0 + BBB, the emitted data comes as S8N1
	// You will have to toggle the UART to match or use a separate UART pair dedicated to read.
	if(typeof device == "string")
		this.uart = new SerialPort(device, {
			baudrate: 115200,
			parity: 'even'
		});

	else this.uart = device;

	this.keyboard = new Keyboard(this);
	this.mouse = new Mouse(this);

	this.uart.on('open', (function() {
		this.open = true;
		if(!this.writeInterval) {
			this.writeInterval = setInterval(this.send.bind(this), 1);
			this.writeInterval.unref();
		}
		this.emit('open');
	}).bind(this));

	this.uart.on('data', (function(data) {
		this.emit('data', data);
	}).bind(this));

	this.uart.on('close', (function() {
		this.emit('close');
		if(this.writeInterval) {
			clearInterval(this.writeInterval);
			this.writeInterval = null;
		}
	}).bind(this));

	this.uart.on('error', (function(err) {
		this.emit('error', err);
	}).bind(this));
}

util.inherits(Isotope, EventEmitter);

Isotope.keyboard = require('./keycodes/keyboard');
Isotope.mouse = require('./keycodes/mouse');

Isotope.prototype.send = function(packet) {
	if(packet) this.buffer.push(packet);
	if(!this.buffer.length) return;
	if(new Date().getTime() - this.lastWrite < 1/this.maxRate) return;
	this.lastWrite = new Date().getTime();
	packet = this.buffer.shift();
	for(var i = 0; i < packet.length; i++)
		if(typeof packet[i] != 'number') {
			this.emit('error', new Error("All packet elements should be numbers, but we were given a '"
				+ (typeof packet[i]) + "' instead."));
			return;
		}
	this.uart.write(packet);
};

Isotope.prototype.mouseRaw = function(target,buttons, deltaX, deltaY, deltaScroll) {
	var packet = zeros(6), length = 4;
	target = target << 5;
	packet[1] = 0x2;
	packet[0] = target;
	packet[2] = 0xff & (buttons || 0);
	packet[3] = 0xff & (deltaX || 0);
	packet[4] = 0xff & (deltaY || 0);
	packet[5] = 0xff & (deltaScroll || 0);

	if(!deltaScroll) {
		length--;
		if(!deltaY) {
			length--;
			if(!deltaX) {
				length--;
				if(!buttons) length--;
			}
		}
	}

	packet[0] |= length + 1;
	this.send(packet.slice(0, length + 2));
};

Isotope.prototype.keyboardRaw = function(target,modifiers, keys) {
	var packet = zeros(8), length = 0;
	target = target << 5
	packet[1] = 0x1;
	packet[0] = target;
	if(!modifiers && (!keys || keys.length == 0)){
		packet[0] |= 1;
		console.log(packet.slice(0,2));
	        return this.send(packet.slice(0, 2));
	}

	if(!Array.isArray(keys)) throw new Error("Keys should be an array");
	if(keys.length > 6) throw new Error("A maximum of 6 keys can be pressed at any time.");

	packet[2] = modifiers & 0xff;
	for(var i = 0; i < keys.length; i++)
		packet[i + 3] = 0xff & (keys[i] || 0);

	packet[0] |= keys.length + 2;
	console.log(packet.slice(0,3+keys.length));
	this.send(packet.slice(0, 3 + keys.length));
};

Isotope.prototype.close = function() {
	this.uart.close();
};

function zeros(n) {
	var o = [];
	for(var i = 0; i < n; i++)
		o.push(0);
	return o;
}
