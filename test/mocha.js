var assert = require('assert');
var WMT = require('..');

describe('midi: false', function() {
  it('requestMIDIAccess() returns error', function(done) {
    WMT.midi = false;
    WMT.requestMIDIAccess().then(() => {}, (error) => {
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
    }, () => {});
  });
  it('requestMIDIAccess({ sysex: true }) returns error', function(done) {
    WMT.midi = true;
    WMT.sysex = false;
    WMT.requestMIDIAccess({ sysex: true }).then(() => {}, (error) => {
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
      var count = 0;
      midi.inputs.forEach((port) => {
        assert.equal(port.type, 'input');
        if (port.name == name1) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'open');
          count++;
          if (count == 2) done();
        }
        if (port.name == name2) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
      });
    }, () => {});
  });
  it('receive MIDI message from MIDIInput', function(done) {
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name1) port.onmidimessage = () => { port.onmidimessage = () => {}; done(); };
      });
      setTimeout(() => { midiin1.emit([0x90, 0x40, 0x7f]); }, 20);
    }, () => {});
  });
  it('connect new MIDIInput', function(done) {
    var name = 'Virtual MIDI-In to connect';
    var midiin = new WMT.MidiSrc(name);
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = () => {};
        midiin.disconnect();
        done();
      };
      setTimeout(() => { midiin.connect(); }, 20);
    }, () => {});
  });
  it('disconnect existing MIDIInput', function(done) {
    var name = 'Virtual MIDI-In to disconnect';
    var midiin = new WMT.MidiSrc(name);
    midiin.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = () => {};
        done();
      };
      setTimeout(() => { midiin.disconnect(); }, 20);
    }, () => {});
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
      var count = 0;
      midi.outputs.forEach((port) => {
        assert.equal(port.type, 'output');
        if (port.name == name1) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'open');
          count++;
          if (count == 2) done();
        }
        if (port.name == name2) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
      });
    }, () => {});
  });
  it('send MIDI message to MIDIOutput', function(done) {
    midiout1.receive = () => { midiout1.receive = () => {}; done(); };
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) { port.send([0x90, 0x40, 0x7f]); port.clear(); }
      });
    }, () => {});
  });
  it('connect new MIDIOutput', function(done) {
    var name = 'Virtual MIDI-Out to connect';
    var midiout = new WMT.MidiDst(name);
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = () => {};
        midiout.disconnect();
        done();
      };
      setTimeout(() => { midiout.connect(); }, 20);
    }, () => {});
  });
  it('disconnect existing MIDIOutput', function(done) {
    var name = 'Virtual MIDI-Out to disconnect';
    var midiout = new WMT.MidiDst(name);
    midiout.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.onstatechange = () => {
        midi.onstatechange = () => {};
        done();
      };
      setTimeout(() => { midiout.disconnect(); }, 20);
    }, () => {});
  });
});
