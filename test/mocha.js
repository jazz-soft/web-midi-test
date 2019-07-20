if (typeof require != 'undefined') {
  var assert = require('assert');
  var WMT = require('..');
  var performance = { now: WMT.now };
}

function noop() {}

function Sequence(list, done) {
  this.done = done;
  this.list = list.slice();
  this.count = 0;
  this.validate = function(data) {
    if (this.count < this.list.length) assert.equal(data.slice().toString(), this.list[this.count].toString());
    this.count++;
    if (this.count == this.list.length) this.done();
  };
}

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
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = 'garbage';
      assert.equal(midi.onstatechange, null);
      assert.equal(midi.inputs.size, 2);
      assert.equal(midi.inputs.keys().next().value, 'Virtual MIDI-In/0');
      assert.equal(midi.inputs.values().next().value.id, 'Virtual MIDI-In/0');
      assert.equal(midi.inputs.entries().next().value[0], 'Virtual MIDI-In/0');
      var count = 0;
      midi.inputs.forEach((port) => {
        assert.equal(port.type, 'input');
        if (port.name == name1) {
          port.onstatechange = 'garbage';
          assert.equal(port.onstatechange, null);
          assert.equal(port.onmidimessage, null);
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
        if (port.name == name2) {
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          port.open().then(noop, noop);
          assert.equal(port.connection, 'closed');
          count++;
          if (count == 2) done();
        }
      });
    }, noop);
  });
  it('receive MIDI message from MIDIInput', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.onmidimessage = 'garbage';
          assert.equal(port.onmidimessage, null);
          port.onmidimessage = () => { port.onmidimessage = noop; done(); };
          assert.equal(port.connection, 'open');
        }
      });
      setTimeout(() => { midiin1.emit([0x90, 0x40, 0x7f]); }, 10);
    }, noop);
  });
  it('closed MIDIInput should not receive messages', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
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
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = (evt) => {
        assert.equal(evt.port.name, name);
        midi.onstatechange = noop;
        midiin.disconnect();
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
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = (evt) => {
        assert.equal(evt.port.name, name);
        midi.onstatechange = noop;
        done();
      };
      setTimeout(() => { midiin.disconnect(); }, 10);
    }, noop);
  });
  it('pending connection', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
      var port1, port2;
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          port1 = port;
          assert.equal(port1.connection, 'closed');
        }
        if (port.name == name2) {
          port2 = port;
          assert.equal(port2.connection, 'closed');
        }
      });
      setTimeout(() => {
        var count = 0;
        midiin1.disconnect();
        midiin2.disconnect();
        port1.open().then(() => { assert.equal(port1.connection, 'open'); count++; if (count == 2) done(); }, noop);
        port2.open().then(noop, () => { assert.equal(port2.connection, 'closed'); count++; if (count == 2) done(); });
        assert.equal(port1.connection, 'pending');
        assert.equal(port2.connection, 'pending');
        setTimeout(() => {
          midiin1.connect();
          midiin2.connect();
        }, 10);
      }, 10);
    }, noop);
  });
  it('close pending connection', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
      var port1, port2;
      midiin1.connect();
      midiin2.connect();
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          port1 = port;
        }
        if (port.name == name2) {
          port2 = port;
        }
      });
      setTimeout(() => {
        var count = 0;
        midiin1.disconnect();
        midiin2.disconnect();
        port1.open().then(noop, () => { assert.equal(port1.connection, 'closed'); count++; if (count == 2) done(); });
        port2.open().then(noop, () => { assert.equal(port2.connection, 'closed'); count++; if (count == 2) done(); });
        setTimeout(() => {
          port1.close().then(noop, noop);
          port2.close().then(noop, noop);
        }, 10);
      }, 10);
    }, noop);
  });
  it('device busy', function(done) {
    var name = 'Busy Virtual MIDI-In';
    var midiin = new WMT.MidiSrc(name);
    var port0;
    midiin.connect();
    WMT.requestMIDIAccess().then((midi) => {
      midi.inputs.forEach((port) => {
        if (port.name == name) {
          port0 = port;
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
        }
      });
      setTimeout(() => {
        midiin.busy = true; midiin.busy = true; midiin.busy = false;
        assert.equal(port0.connection, 'closed'); done();
      }, 10);
    }, noop);
  });
  it('MIDIInput: onstatechange()', function(done) {
    var name = 'Another Virtual MIDI-In';
    var midiin = new WMT.MidiSrc(name);
    midiin.connect();
    WMT.requestMIDIAccess().then((midi) => {
      var b = false;
      midi.inputs.forEach((port) => {
        if (port.name == name) {
          port.onstatechange = (evt) => {
            assert.equal(evt.port.name, name);
            if (evt.port.state == 'disconnected') b = !b;
            else if (evt.port.state == 'connected') {
              if (b) {
                evt.port.onstatechange = noop;
                done();
              }
            }
          };
        }
      });
      setTimeout(() => { midiin.disconnect(); setTimeout(() => { midiin.connect(); }, 10); }, 10);
    }, noop);
  });
  it('split MIDI messages: sysex alloved', function(done) {
    midiin1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      var myport;
      var notes = [
        [0xfe],
        [0xc0, 0x10],
        [0x90, 0x40, 0x7f],
        [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7],
        [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7],
        [0x80, 0x40, 0x00]
      ];
      var seq = new Sequence(notes, function() { myport.onmidimessage = noop; done(); });
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          myport = port;
          port.onmidimessage = (msg) => { seq.validate(new Array(msg.data)); };
        }
      });
      setTimeout(() => {
        midiin1.emit([0x00, 0xfe, 0x00, 0xc0]);
        midiin1.emit([0x10, 0x90, 0x40, 0x7f]);
        midiin1.emit([0xf0, 0x7e, 0x7f, 0x06]);
        midiin1.emit([0x01, 0xf7, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7, 0xf7, 0x80]);
        midiin1.emit([0x80, 0x40, 0x00, 0x00]);
      }, 10);
    }, noop);
  });
  it('split MIDI messages: sysex ignored', function(done) {
    midiin1.connect();
    WMT.requestMIDIAccess().then((midi) => {
      var myport;
      var notes = [
        [0xfe],
        [0xc0, 0x10],
        [0x90, 0x40, 0x7f],
        [0x80, 0x40, 0x00]
      ];
      var seq = new Sequence(notes, function() { myport.onmidimessage = noop; done(); });
      midi.inputs.forEach((port) => {
        if (port.name == name1) {
          myport = port;
          port.onmidimessage = (msg) => { seq.validate(new Array(msg.data)); };
        }
      });
      setTimeout(() => {
        midiin1.emit([0x00, 0xfe, 0x00, 0xc0]);
        midiin1.emit([0x10, 0x90, 0x40, 0x7f]);
        midiin1.emit([0xf0, 0x7e, 0x7f, 0x06]);
        midiin1.emit([0x01, 0xf7, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7, 0xf7, 0x80]);
        midiin1.emit([0x80, 0x40, 0x00, 0x00]);
      }, 10);
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
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = 'garbage';
      assert.equal(midi.onstatechange, null);
      assert.equal(midi.outputs.size, 2);
      assert.equal(midi.outputs.size, 2);
      assert.equal(midi.outputs.keys().next().value, 'Virtual MIDI-Out/0');
      assert.equal(midi.outputs.values().next().value.id, 'Virtual MIDI-Out/0');
      assert.equal(midi.outputs.entries().next().value[0], 'Virtual MIDI-Out/0');
      var count = 0;
      midi.outputs.forEach((port) => {
        assert.equal(port.type, 'output');
        if (port.name == name1) {
          port.onstatechange = 'garbage';
          assert.equal(port.onstatechange, null);
          assert.equal(port.state, 'connected');
          assert.equal(port.connection, 'closed');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
          port.open().then(noop, noop);
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
          port.close().then(noop, noop);
          assert.equal(port.connection, 'closed');
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
    WMT.requestMIDIAccess().then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) { port.send([0x90, 0x40, 0x7f]); port.clear(); }
      });
    }, noop);
  });
  it('send delayed MIDI message to MIDIOutput', function(done) {
    var notes = [
      [0x90, 0x40, 0x7f], [0x90, 0x41, 0x7f], [0x90, 0x42, 0x7f], [0x90, 0x43, 0x7f],
      [0x90, 0x44, 0x7f], [0x90, 0x45, 0x7f], [0x90, 0x46, 0x7f], [0x90, 0x47, 0x7f]
    ];
    var seq = new Sequence(notes, function() { midiout1.receive = noop; done(); });
    midiout1.receive = (msg) => { seq.validate(msg); };
    WMT.requestMIDIAccess().then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          var now = performance.now();
          for (var i = notes.length - 1; i >= 0; i--) port.send(notes[i], now + i * 10);
        }
      });
    }, noop);
  });
  it('clear MIDIOutput', function(done) {
    var notes1 = [[0x90, 0x40, 0x7f], [0x90, 0x41, 0x7f], [0x90, 0x42, 0x7f], [0x90, 0x43, 0x7f]];
    var notes2 = [[0x90, 0x44, 0x7f], [0x90, 0x45, 0x7f], [0x90, 0x46, 0x7f], [0x90, 0x47, 0x7f]];
    var seq = new Sequence(notes2, function() { midiout1.receive = noop; done(); });
    midiout1.receive = (msg) => { seq.validate(msg); };
    var i;
    WMT.requestMIDIAccess().then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          var now = performance.now();
          for (i = 0; i < notes1.length; i++) port.send(notes1[i], now + i * 10 + 10);
          port.close();
          for (i = 0; i < notes2.length; i++) port.send(notes2[i], now + i * 10 + 10);
        }
      });
    }, noop);
  });
  it('connect new MIDIOutput', function(done) {
    var name = 'Virtual MIDI-Out to connect';
    var midiout = new WMT.MidiDst(name);
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = (evt) => {
        assert.equal(evt.port.name, name);
        midi.onstatechange = noop;
        midiout.disconnect();
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
    WMT.requestMIDIAccess().then((midi) => {
      midi.onstatechange = (evt) => {
        assert.equal(evt.port.name, name);
        midi.onstatechange = noop;
        done();
      };
      setTimeout(() => { midiout.disconnect(); }, 10);
    }, noop);
  });
  it('pending connection', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
      var port1, port2;
      midiout1.connect();
      midiout2.connect();
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          port1 = port;
          assert.equal(port1.connection, 'closed');
        }
        if (port.name == name2) {
          port2 = port;
          assert.equal(port2.connection, 'closed');
        }
      });
      setTimeout(() => {
        var count = 0;
        midiout1.disconnect();
        midiout2.disconnect();
        port1.open().then(() => { assert.equal(port1.connection, 'open'); count++; if (count == 2) done(); }, noop);
        port2.open().then(noop, () => { assert.equal(port2.connection, 'closed'); count++; if (count == 2) done(); });
        assert.equal(port1.connection, 'pending');
        assert.equal(port2.connection, 'pending');
        setTimeout(() => {
          midiout1.connect();
          midiout2.connect();
        }, 10);
      }, 10);
    }, noop);
  });
  it('close pending connection', function(done) {
    WMT.requestMIDIAccess().then((midi) => {
      var port1, port2;
      midiout1.connect();
      midiout2.connect();
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          port1 = port;
        }
        if (port.name == name2) {
          port2 = port;
        }
      });
      setTimeout(() => {
        var count = 0;
        midiout1.disconnect();
        midiout2.disconnect();
        port1.open().then(noop, () => { assert.equal(port1.connection, 'closed'); count++; if (count == 2) done(); });
        port2.open().then(noop, () => { assert.equal(port2.connection, 'closed'); count++; if (count == 2) done(); });
        setTimeout(() => {
          port1.close().then(noop, noop);
          port2.close().then(noop, noop);
        }, 10);
      }, 10);
    }, noop);
  });
  it('device busy', function(done) {
    var name = 'Busy Virtual MIDI-Out';
    var midiout = new WMT.MidiDst(name);
    var port0;
    midiout.connect();
    WMT.requestMIDIAccess().then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name) {
          port0 = port;
          port.open().then(noop, noop);
          assert.equal(port.connection, 'open');
        }
      });
      setTimeout(() => {
        midiout.busy = true; midiout.busy = true; midiout.busy = false;
        assert.equal(port0.connection, 'closed'); done();
      }, 10);
    }, noop);
  });
  it('MIDIOutput: onstatechange()', function(done) {
    var name = 'Another Virtual MIDI-Out';
    var midiout = new WMT.MidiDst(name);
    midiout.connect();
    WMT.requestMIDIAccess().then((midi) => {
      var b = false;
      midi.outputs.forEach((port) => {
        if (port.name == name) {
          port.onstatechange = (evt) => {
            assert.equal(evt.port.name, name);
            if (evt.port.state == 'disconnected') b = !b;
            else if (evt.port.state == 'connected') {
              if (b) {
                evt.port.onstatechange = noop;
                done();
              }
            }
          };
        }
      });
      setTimeout(() => { midiout.disconnect(); setTimeout(() => { midiout.connect(); }, 10); }, 10);
    }, noop);
  });
  // MIDI validation
  it('MIDI validation: sysex alloved', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          port.send([0xfe, 0xc0, 0x10, 0x90, 0x40, 0x7f, 0x80, 0x40, 0x00, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);
          done();
        }
      });
    }, noop);
  });
  it('MIDI validation: sysex not alloved', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess().then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([0xfe, 0xc0, 0x10, 0x90, 0x40, 0x7f, 0x80, 0x40, 0x00, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);
          }
          catch (err) {
            assert.equal(err.name, 'InvalidAccessError');
            done();
          }
        }
      });
    }, noop);
  });
  it('MIDI validation: incomplete message', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([0xfe, 0xc0, /*0x10,*/ 0x90, 0x40, 0x7f, 0x80, 0x40, 0x00, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);
          }
          catch (err) {
            assert.equal(err.name, 'TypeError');
            done();
          }
        }
      });
    }, noop);
  });
  it('MIDI validation: incomplete sysex', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([0xfe, 0xc0, 0x10, 0x90, 0x40, 0x7f, 0x80, 0x40, 0x00, 0xf0, 0x7e, 0x7f, 0x06, 0x01, /*0xf7*/]);
          }
          catch (err) {
            assert.equal(err.name, 'TypeError');
            done();
          }
        }
      });
    }, noop);
  });
  it('MIDI validation: unexpected running status', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([/*0xfe, 0xc0,*/ 0x10, 0x90, 0x40, 0x7f, 0x80, 0x40, 0x00, 0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]);
          }
          catch (err) {
            assert.equal(err.name, 'TypeError');
            done();
          }
        }
      });
    }, noop);
  });
  it('MIDI validation: unexpected sysex terminator', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([0xf7]);
          }
          catch (err) {
            assert.equal(err.name, 'TypeError');
            done();
          }
        }
      });
    }, noop);
  });
  it('MIDI validation: value out of range', function(done) {
    midiout1.connect();
    WMT.requestMIDIAccess({ sysex: true }).then((midi) => {
      midi.outputs.forEach((port) => {
        if (port.name == name1) {
          try {
            port.send([-1]);
          }
          catch (err) {
            assert.equal(err.name, 'TypeError');
            done();
          }
        }
      });
    }, noop);
  });
});
