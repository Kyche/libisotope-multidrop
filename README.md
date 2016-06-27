# Isotope
**USB Input emulation library built on the ATmega32u4**

Isotope is a project designed to permit the emulation of USB HID (Human Input Device) class peripherals on any system with a compatible USB HID driver (most modern operating systems) through the combination of an easy to use developer library and an ATmega32u4 chip connected through a serial port. Its initial target is the Raspberry Pi, allowing voice control of a computer without the need for any specialized software, and with no processing overhead on the target system.

## Example

```javascript
var Isotope = require('libisotope');
var iso = new Isotope('/dev/ttyAMA0');
iso.keyboard.write(0,"Hello World!");
iso.then.ctrl(0).alt(0).press(0,Isotope.keyboard.keys.delete).then.releaseAll;
```
