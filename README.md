# web-midi-test

[![npm](https://img.shields.io/npm/v/web-midi-test.svg)](https://www.npmjs.com/package/web-midi-test)
[![npm](https://img.shields.io/npm/dt/web-midi-test.svg)](https://www.npmjs.com/package/web-midi-test)
[![Build Status](https://travis-ci.org/jazz-soft/web-midi-test.svg?branch=master)](https://travis-ci.org/jazz-soft/web-midi-test)
[![Coverage Status](https://coveralls.io/repos/github/jazz-soft/web-midi-test/badge.svg?branch=master)](https://coveralls.io/github/jazz-soft/web-midi-test?branch=master)

## Fake Web MIDI API for testing Web MIDI applications

See also: [**Web MIDI API**](https://webaudio.github.io/web-midi-api/)

See also: [**midi-test**](https://github.com/jazz-soft/midi-test)

Install: `npm install web-midi-test --save-dev`

## Usage
### In Node.js

    var WMT = require('web-midi-test');
    // ...

### In HTML

    <script src="node_modules/wweb-midi-test/wmt.js"></script>
    // this will add an object named WMT into the global scope
    // ...

## API
### MIDI access

    function onSuccess() { console.log('Success!'); }
    function onFail() { console.log('Fail!'); }
    
    // normal scenario
    WMT.requestMIDIAccess().then(onSuccess, onFail); // Success!
    WMT.requestMIDIAccess({ sysex: true }).then(onSuccess, onFail); // Success!
    
    // no sysex permission scenario
    WMT.sysex = false;
    WMT.requestMIDIAccess().then(onSuccess, onFail); // Success!
    WMT.requestMIDIAccess({ sysex: true }).then(onSuccess, onFail); // Fail!
    
    // no midi permission scenario
    WMT.midi = false;
    WMT.requestMIDIAccess().then(onSuccess, onFail); // Fail!

### MIDI Source (Virtual MIDI-In)

    var port = new WMT.MidiSrc('VIRTUAL MIDI-In');
    port.connect();
    port.emit([0x90, 0x40, 0x7f]);
    //...
    port.disconnect();

### MIDI Destination (Virtual MIDI-Out)

    var port = new WMT.MidiDst('VIRTUAL MIDI-Out');
    port.receive = function(msg) { console.log('received:', msg); };
    port.connect();
    //...
    port.disconnect();
