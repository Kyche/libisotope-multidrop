/**
 * Isotope Node.js Library
 * Provides a Node.js interface between the Isotope emulation chip
 * and the local system, as well as a number of useful command
 * wrappers.
 *
 * Copyright © Benjamin Pannell 2014
 */

var mouse = require('../keycodes/mouse');

module.exports = Mouse;

function Mouse(isotope) {
	this.isotope = isotope;

	this.buttons = 0;
	this.deltaX = 0;
	this.deltaY = 0;
	this.deltaScroll = 0;

	this.updateTimeout = null;
}

Mouse.prototype = {
	get then(target) {
		if(this.updateTimeout) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}

		this.isotope.mouseRaw(target,this.buttons | this.tempButtons, this.deltaX, this.deltaY, this.deltaScroll);
		this.tempButtons = 0;
		this.deltaX = 0;
		this.deltaY = 0;
		this.deltaScroll = 0;
		this.updateTimeout = null;

		return this;
	},
	get left(target) {
		this.tempButtons |= mouse.left;
		return this.queueUpdate(target);
	},
	get right(target) {
		this.tempButtons |= mouse.right;
		return this.queueUpdate(target);
	},
	get middle(target) {
		this.tempButtons |= mouse.middle;
		return this.queueUpdate(target);
	}
};

Mouse.prototype.queueUpdate = function(target) {
	if(!this.updateTimeout)
		this.updateTimeout = process.nextTick((function() {
			this.updateTimeout = null;
			this.now(target);
		}).bind(this));
	return this;
};

Mouse.prototype.now = function(target) {
	return this.then(target);
};

Mouse.prototype.press = function(target,buttons) {
	if(!Array.isArray(buttons))
		buttons = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < buttons.length; i++)
		this.buttons |= buttons[i];

	this.queueUpdate(target);
	return this;
};

Mouse.prototype.release = function(target,buttons) {
	if(!Array.isArray(buttons))
		buttons = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < buttons.length; i++) {
		var compliment = 0xff ^ buttons[i];
		this.buttons &= compliment;
	}

	this.queueUpdate(target);
	return this;
};

Mouse.prototype.scroll = function(target,delta) {
	this.deltaScroll += delta;
	this.queueUpdate(target);
	return this;
};

Mouse.prototype.move = function(target,deltaX, deltaY) {
	this.deltaX += deltaX;
	this.deltaY += deltaY;
	this.queueUpdate(target);
	return this;
};
