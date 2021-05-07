const JSDOM = require('jsdom').JSDOM;
const WMT =  require('web-midi-test');

const midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
const midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
const midi_in3 = new WMT.MidiSrc('VIRTUAL MIDI-In 3');
const midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
const midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
const midi_out3 = new WMT.MidiDst('VIRTUAL MIDI-Out 3');

midi_in3.busy = true;
midi_out3.busy = true;

midi_in1.connect();
midi_in2.connect();
midi_in3.connect();
midi_out1.connect();
midi_out2.connect();
midi_out3.connect();

midi_out1.receive = function(msg) { console.log('VIRTUAL MIDI-Out 1 received:', msg); };
midi_out2.receive = function(msg) { console.log('VIRTUAL MIDI-Out 2 received:', msg); };
midi_out3.receive = function(msg) { console.log('VIRTUAL MIDI-Out 3 received:', msg); };

function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
  const dom = await JSDOM.fromFile('test.html', {
    resources: 'usable',
    runScripts: 'dangerously',
    beforeParse: window => { window.navigator.requestMIDIAccess = WMT.requestMIDIAccess; }
  });
  await timeout(100);
  midi_in1.emit([0x90, 0x60, 0x7f]);
  midi_in2.emit([0x90, 0x60, 0x7f]);
  midi_in3.emit([0x90, 0x60, 0x7f]);
  await timeout(100);
})();