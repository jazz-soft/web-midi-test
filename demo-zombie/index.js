const Browser = require('zombie');
const WMT =  require('web-midi-test');

var midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
var midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
var midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
var midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
midi_in1.connect();
midi_in2.connect();
midi_out1.connect();
midi_out2.connect();

const browser = new Browser();
browser.on('loaded', function(doc) {
  browser.window.navigator.requestMIDIAccess = WMT.requestMIDIAccess;
});
browser.visit('file://' + __dirname + '/test.html', function() {
  console.log('### STATUS:', browser.status, 'URL:', browser.url);
});
