# web-midi-test

[![npm](https://img.shields.io/npm/v/web-midi-test.svg)](https://www.npmjs.com/package/web-midi-test)
[![npm](https://img.shields.io/npm/dt/web-midi-test.svg)](https://www.npmjs.com/package/web-midi-test)
[![build](https://github.com/jazz-soft/web-midi-test/actions/workflows/build.yml/badge.svg)](https://github.com/jazz-soft/web-midi-test/actions)
[![Coverage Status](https://coveralls.io/repos/github/jazz-soft/web-midi-test/badge.svg?branch=master)](https://coveralls.io/github/jazz-soft/web-midi-test?branch=master)
[![Try web-midi-test on RunKit](https://badge.runkitcdn.com/web-midi-test.svg)](https://npm.runkit.com/web-midi-test)

## Fake Web MIDI API for testing Web MIDI applications

See also: [**Web MIDI API**](https://webaudio.github.io/web-midi-api/)

See also: [**midi-test**](https://github.com/jazz-soft/midi-test),
[**jazz-midi-headless**](https://github.com/jazz-soft/jazz-midi-headless),
[**test-midi-files**](https://github.com/jazz-soft/test-midi-files)

Install: `npm install web-midi-test --save-dev`

## Usage
#### Node.js

```js
var WMT = require('web-midi-test');
var navigator = { requestMIDIAccess: WMT.requestMIDIAccess };
var performance = { now: WMT.now }; // if required...
// ...
```

#### HTML

```html
<script src="node_modules/web-midi-test/wmt.js"></script>
// this will add an object named WMT into the global scope
// ...
if (typeof navigator.requestMIDIAccess == 'undefined') {
  navigator.requestMIDIAccess = WMT.requestMIDIAccess;
}
// ...
```

#### TypeScript
`tsc myscript.ts --lib es2015,dom`

```ts
import * as WMT from 'web-midi-test';
// ...
```

#### With [JSDOM](https://github.com/jazz-soft/web-midi-test/tree/master/demo-jsdom)  
#### With [Zombie.js](https://github.com/jazz-soft/web-midi-test/tree/master/demo-zombie)
#### With [Puppeteer](https://github.com/jazz-soft/web-midi-test/tree/master/demo-puppeteer)

## API
#### MIDI access

```js
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
```

#### MIDI Source (Virtual MIDI-In)

```js
var port = new WMT.MidiSrc('VIRTUAL MIDI-In');
port.connect();
port.emit([0x90, 0x40, 0x7f]);
//...
port.busy = true;  // "another application" captured the port
// Web MIDI can see the port, but can not connect to it
port.busy = false; // "another application" released the port
//...
port.disconnect();
```

#### MIDI Destination (Virtual MIDI-Out)

```js
var port = new WMT.MidiDst('VIRTUAL MIDI-Out');
port.receive = function(msg) { console.log('received:', msg); };
port.connect();
//...
port.busy = true;  // "another application" captured the port
// Web MIDI can see the port, but can not connect to it
port.busy = false; // "another application" released the port
//...
port.disconnect();
```
