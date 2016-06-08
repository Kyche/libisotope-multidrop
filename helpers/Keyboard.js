/**
 * Isotope Node.js Library
 * Provides a Node.js interface between the Isotope emulation chip
 * and the local system, as well as a number of useful command
 * wrappers.
 *
 * Copyright © Benjamin Pannell 2014
 */

var keyCodes = require('../keycodes/keyboard');

var charMap = {
	immutable: "\t ",
	normal: "abcdefghijklmnopqrstuvwxyz1234567890-=[]\\;'`,./",
	shifted: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|:\"~<>?"
}
var codeMap = {
	immutable: [43,44],
	mutable: [
		4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,
		30,31,32,33,34,35,36,37,38,39,
		45,46,47,48,49,51,52,53,54,55,56
	]
};

module.exports = Keyboard;

function Keyboard(isotope) {
	this.isotope = isotope;

	this.updateTimeout = null;

	this.activeKeys = [];
	this.activeModifiers = 0;
	this.temporaryModifiers = 0;
}

Keyboard.prototype.then = function(target) {
		if(this.updateTimeout) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}

		this.isotope.keyboardRaw(target,this.activeModifiers | this.temporaryModifiers, this.activeKeys);
		this.temporaryModifiers = 0;
		return this;
}


Keyboard.prototype.ctrl = function(target) {
		this.temporaryModifiers |= keyCodes.modifiers.ctrl;
		return this.queueUpdate(target);
	}
Keyboard.prototype.alt = function(target) {
		this.temporaryModifiers |= keyCodes.modifiers.alt;
		return this.queueUpdate(target);
	}
Keyboard.prototype.shift = function(target) {
		this.temporaryModifiers |= keyCodes.modifiers.shift;
		return this.queueUpdate(target);
	}
Keyboard.prototype.releaseAll = function(target) {
		this.activeKeys = [];
		this.temporaryModifiers = 0;
		this.activeModifiers = 0;
		return this.queueUpdate(target);
	}


Keyboard.prototype.queueUpdate = function(target) {
	if(!this.updateTimeout)
		this.updateTimeout = process.nextTick((function() {
			this.updateTimeout = null;
			this.now(target);
		}).bind(this));
	return this;
};

Keyboard.prototype.press = function(target,keys) {
	if(!Array.isArray(keys))
		keys = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < keys.length; i++)
		if(!~this.activeKeys.indexOf(keys[i]))
			this.activeKeys.push(keys[i]);
	if(this.activeKeys.length > 6)
		this.activeKeys = this.activeKeys.slice(this.activeKeys.length - 6);

	this.queueUpdate(target);
	return this;
};

Keyboard.prototype.release = function(target,keys) {
	if(!Array.isArray(keys))
		keys = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < keys.length; i++)
		if(~this.activeKeys.indexOf(keys[i]))
			this.activeKeys.splice(this.activeKeys.indexOf(keys[i]), 1);

	this.queueUpdate(target);
	return this;
};

Keyboard.prototype.pressModifiers = function(target,modifiers) {
	if(!Array.isArray(modifiers))
		modifiers = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < modifiers.length; i++)
		this.activeModifiers |= modifiers[i];

	this.queueUpdate(target);
	return this;
};

Keyboard.prototype.releaseModifiers = function(target,modifiers) {
	if(!Array.isArray(modifiers))
		modifiers = Array.prototype.slice.call(arguments, 0);
	for(var i = 0; i < modifiers.length; i++) {
		var compliment = 0xff ^ modifiers[i];
		this.activeModifiers &= compliment;
	}

	this.queueUpdate(target);
	return this;
};

Keyboard.prototype.write = function(target,text) {
	var index, lastIndex, c, m;
	for(var i = 0; i < text.length; i++) {
		lastIndex = index;

		// Handle the same character
		if(c == text[i]) {
			this.isotope.keyboardRaw(target);

			// And disable handling of the shift-changed keys
			lastIndex = -1;
		}

		c = text[i];

		if(~(index = charMap.immutable.indexOf(c))) this.isotope.keyboardRaw(target,0, [codeMap.immutable[index]]);
		else {
			m = 0;
			if(~(index = charMap.normal.indexOf(c))) m = 0;
			else if(~(index = charMap.shifted.indexOf(c))) m = keyCodes.modifiers.shift;
			else {
				console.warn("Unknown characer '%c'", c);
				continue;
			}

			// Handle the same key (with shift changed)
			if(index == lastIndex) this.isotope.keyboardRaw(target);

			// Send the new key
			this.isotope.keyboardRaw(target,m, [codeMap.mutable[index]]);
		}
	}

	this.isotope.keyboardRaw(target);
	return this;
};

Keyboard.prototype.now = function(target) {
	return this.then(target);
};
