/**
 * Isotope Node.js Library
 * Provides a Node.js interface between the Isotope emulation chip
 * and the local system, as well as a number of useful command
 * wrappers.
 *
 * Utility module for miscellaneous commands to Teensy devices.
 * Implemented for the purposes of polling enumeration state so
 * receive signals on the host aren't garbled.
 *
 * Authored by Kevin Chen 2016
 */

module.exports = Utils;

function Utils(isotope) {
  this.isotope = isotope;

  this.updateTimeout = null;

  this.op = 0x0;

}

Utils.prototype.then = function(target) {
		if(this.updateTimeout) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}

		this.isotope.utilsRaw(target,this.op);
		this.updateTimeout = null;

		return this;
	}

Utils.prototype.queueUpdate = function(target) {
	if(!this.updateTimeout)
		this.updateTimeout = process.nextTick((function() {
			this.updateTimeout = null;
			this.now(target);
		}).bind(this));
	return this;
}

Utils.prototype.now = function(target) {
	return this.then(target);
}

Utils.prototype.poll = function(target) {
	this.op = 0x1;

	this.queueUpdate(target);
	return this;
}

Utils.prototype.reset = function(target) {
        this.op = 0x2;

        this.queueUpdate(target);
        return this;
}


function op_map(operation) {
	m = {nothing: 0x0,
	     poll: 0x1,
	     reset: 0x2}
}
