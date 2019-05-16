function _readonly(obj, name, val) {
  Object.defineProperty(obj, name, { get: function() { return val; }, enumerable: true });
}

class MIDIAccess {
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

function requestMIDIAccess() {
  return new Promise((resolve, reject) => {
    if (_midi) {
      resolve(new MIDIAccess());
    }
    else {
      reject(new DOMException('Error', 'Coming soon...', 9));
    }
  });
}

var WMT = {
  requestMIDIAccess: requestMIDIAccess
};

Object.defineProperty(WMT, 'midi', { get: function() { return _midi; }, set: function(b) { _midi = !!b; }, enumerable: true });
Object.defineProperty(WMT, 'sysex', { get: function() { return _sysex; }, set: function(b) { _sysex = !!b; }, enumerable: true });

module.exports = WMT;
