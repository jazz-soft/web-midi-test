function _readonly(obj, name, val) {
  Object.defineProperty(obj, name, { get: function() { return val; }, enumerable: true });
}

class MIDIAccess {
  constructor(sysex) {
    _readonly(this, 'inputs', []);
    _readonly(this, 'outputs', []);
    _readonly(this, 'sysexEnabled', sysex);
  }
}

class DOMException {
  constructor(name, message, code) {
    _readonly(this, 'name', name);
    _readonly(this, 'message', message);
    _readonly(this, 'code', code);
  }
}

var _midi = true;
var _sysex = true;

function requestMIDIAccess(arg) {
  var sysex = !!(arg && arg.sysex);
  return new Promise((resolve, reject) => {
    if (_midi) {
      if (sysex && !_sysex) {
        reject(new DOMException('SecurityError', 'Sysex is not allowed', 18));
      }
      else {
        resolve(new MIDIAccess(sysex));
      }
    }
    else {
      reject(new DOMException('SecurityError', 'MIDI is not allowed', 18));
    }
  });
}

var WMT = {
  requestMIDIAccess: requestMIDIAccess
};

Object.defineProperty(WMT, 'midi', { get: function() { return _midi; }, set: function(b) { _midi = !!b; }, enumerable: true });
Object.defineProperty(WMT, 'sysex', { get: function() { return _sysex; }, set: function(b) { _sysex = !!b; }, enumerable: true });

module.exports = WMT;
