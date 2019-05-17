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
