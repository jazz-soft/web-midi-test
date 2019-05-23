var assert = require('assert');
var WMT = require('..');

describe('midi: false', function() {
  it('requestMIDIAccess() returns error', function(done) {
    WMT.midi = false;
    WMT.requestMIDIAccess().then(() => {}, () => { done(); });
  });
});

describe('midi: true; sysex: false', function() {
  it('requestMIDIAccess() returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = false;
    WMT.requestMIDIAccess().then((midi) => {
      assert.equal(midi.sysexEnabled, false);
      done();
    }, () => {});
  });
  it('requestMIDIAccess({ sysex: true }) returns error', function(done) {
    WMT.midi = true;
    WMT.sysex = false;
    WMT.requestMIDIAccess({ sysex: true }).then(() => {}, () => { done(); });
  });
});

describe('midi: true; sysex: true', function() {
  it('requestMIDIAccess() returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = true;
    WMT.requestMIDIAccess().then((midi) => {
      assert.equal(midi.sysexEnabled, false);
      done();
    }, () => {});
  });
  it('requestMIDIAccess({ sysex: true }) returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = true;
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      assert.equal(midi.sysexEnabled, true);
      done();
    }, () => {});
  });
});

describe('Virtual MIDI-In', function() {
  WMT.midi = true;
  WMT.sysex = true;
  var name = 'Virtual MIDI-In';
  var midiin = new WMT.MidiSrc(name);
  midiin.connect();
  it('port is visible', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name) done();
      });
    }, () => {});
  });
  it('receive MIDI message', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name) port.onmidimessage = () => { port.onmidimessage = () => {}; done(); };
      });
      setTimeout(() => { midiin.emit([0x90, 0x40, 0x7f]); }, 20);
    }, () => {});
  });
});

describe('Virtual MIDI-Out', function() {
  WMT.midi = true;
  WMT.sysex = true;
  var name = 'Virtual MIDI-Out';
  var midiout = new WMT.MidiDst(name);
  midiout.connect();
  it('port is visible', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name) done();
      });
    }, () => {});
  });
  it('send MIDI message', function(done) {
    midiout.receive = () => { midiout.receive = () => {}; done(); };
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name) { port.send([0x90, 0x40, 0x7f]); port.clear(); }
      });
    }, () => {});
  });
});
