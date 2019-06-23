var assert = require('assert');
var WMT = require('..');
function noop() {};

describe('midi: false', function() {
  it('requestMIDIAccess() returns error', function(done) {
    WMT.midi = false;
    WMT.requestMIDIAccess().then(noop, (error) => {
      assert.equal(error.name, 'SecurityError');
      done();
    });
  });
});

describe('midi: true; sysex: false', function() {
  it('requestMIDIAccess() returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = false;
    WMT.requestMIDIAccess().then((midi) => {
      assert.equal(midi.sysexEnabled, false);
      done();
    }, noop);
  });
  it('requestMIDIAccess({ sysex: true }) returns error', function(done) {
    WMT.midi = true;
    WMT.sysex = false;
    WMT.requestMIDIAccess({ sysex: true }).then(noop, (error) => {
      assert.equal(error.name, 'SecurityError');
      done();
    });
  });
});

describe('midi: true; sysex: true', function() {
  it('requestMIDIAccess() returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = true;
    WMT.requestMIDIAccess().then((midi) => {
      assert.equal(midi.sysexEnabled, false);
      done();
    }, noop);
  });
  it('requestMIDIAccess({ sysex: true }) returns success', function(done) {
    WMT.midi = true;
    WMT.sysex = true;
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      assert.equal(midi.sysexEnabled, true);
      done();
    }, noop);
  });
});

describe('MIDI-In', function() {
  WMT.midi = true;
  WMT.sysex = true;
  var name1 = 'Virtual MIDI-In';
  var name2 = 'Virtual MIDI-In - busy';
  var midiin1 = WMT.MidiSrc(name1); // should work with or without 'new'
  var midiin2 = new WMT.MidiSrc(name2);
  midiin1.connect();
  midiin2.busy = true;
  midiin2.connect();
  it('port is listed in MIDIInputMap', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      assert.equal(midi.inputs.size, 2);
      assert.equal(midi.inputs.values().length, 2);
      assert.equal(midi.inputs.entries().length, 2);
      var count = 0;
      midi.inputs.forEach((port) => {
        assert.equal(port.type, 'input');
        if (port.name == name1) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'open');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
          count++;
          if (count == 2) done();
        }
        if (port.name == name2) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
      });
    }, noop);
  });
  it('receive MIDI message from MIDIInput', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.onmidimessage = () => { port.onmidimessage = noop; done(); };
          assert.equal(port.connection, 'open');
        }
      });
      setTimeout(() => { midiin1.emit([0x90, 0x40, 0x7f]); }, 10);
    }, noop);
  });
  it('closed MIDIInput should not receive messages', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          port.onmidimessage = () => { assert.equal(undefined, 'The port should be closed!'); };
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
        }
        if (port.name == name2) {
          port.onmidimessage = () => { assert.equal(undefined, 'The port should be closed!'); };
        }
      });
      setTimeout(() => { midiin1.emit([0x90, 0x40, 0x7f]); midiin2.emit([0x90, 0x40, 0x7f]); setTimeout(() => { done(); }, 10); }, 10);
    }, noop);
  });
  it('connect new MIDIInput', function(done) {
    var name = 'Virtual MIDI-In to connect';
    var midiin = new WMT.MidiSrc(name);
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = noop;
        midiin.disconnect();
        done();
      };
      setTimeout(() => { midiin.connect(); }, 10);
    }, noop);
  });
  it('disconnect existing MIDIInput', function(done) {
    var name = 'Virtual MIDI-In to disconnect';
    var midiin = new WMT.MidiSrc(name);
    midiin.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = noop;
        done();
      };
      setTimeout(() => { midiin.disconnect(); }, 10);
    }, noop);
  });
});

describe('MIDI-Out', function() {
  WMT.midi = true;
  WMT.sysex = true;
  var name1 = 'Virtual MIDI-Out';
  var name2 = 'Virtual MIDI-Out - busy';
  var midiout1 = WMT.MidiDst(name1); // should work with or without 'new'
  var midiout2 = new WMT.MidiDst(name2);
  midiout1.connect();
  midiout2.busy = true;
  midiout2.connect();
  it('port is listed in MIDIOutputMap', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      assert.equal(midi.outputs.size, 2);
      assert.equal(midi.outputs.values().length, 2);
      assert.equal(midi.outputs.entries().length, 2);
      var count = 0;
      midi.outputs.forEach((port) => {
        assert.equal(port.type, 'output');
        if (port.name == name1) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'open');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
          count++;
          if (count == 2) done();
        }
        if (port.name == name2) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
      });
    }, noop);
  });
  it('send MIDI message to MIDIOutput', function(done) {
    midiout1.receive = () => { midiout1.receive = noop; done(); };
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) { port.send([0x90, 0x40, 0x7f]); port.clear(); }
      });
    }, noop);
  });
  it('connect new MIDIOutput', function(done) {
    var name = 'Virtual MIDI-Out to connect';
    var midiout = new WMT.MidiDst(name);
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = noop;
        midiout.disconnect();
        done();
      };
      setTimeout(() => { midiout.connect(); }, 10);
    }, noop);
  });
  it('disconnect existing MIDIOutput', function(done) {
    var name = 'Virtual MIDI-Out to disconnect';
    var midiout = new WMT.MidiDst(name);
    midiout.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = noop;
        done();
      };
      setTimeout(() => { midiout.disconnect(); }, 10);
    }, noop);
  });
});
