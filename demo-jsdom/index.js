const JSDOM = require('jsdom').JSDOM;
const WMT =  require('web-midi-test');

var midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
var midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
var midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
var midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
midi_in1.connect();
midi_in2.connect();
midi_out1.connect();
midi_out2.connect();

JSDOM.fromFile('test.html', {
  resources: 'usable',
  runScripts: 'dangerously',
  beforeParse: window => { window.navigator.requestMIDIAccess = WMT.requestMIDIAccess; }
}).then(dom => { console.log('Thank you!'); });
