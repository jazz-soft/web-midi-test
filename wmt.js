function _readonly(obj, name, val) {
  Object.defineProperty(obj, name, { get: function() { return val; }, enumerable: true });
}

function MidiSrc(name, man, ver) {
  if (!(this instanceof MidiSrc)) return new MidiSrc(name, man, ver);
  _readonly(this, 'name', '' + name);
  _readonly(this, 'manufacturer', '' + man);
  _readonly(this, 'version', '' + ver);
}

function MidiDst(name, man, ver) {
  if (!(this instanceof MidiSrc)) return new MidiSrc(name, man, ver);
  _readonly(this, 'name', '' + name);
  _readonly(this, 'manufacturer', '' + man);
  _readonly(this, 'version', '' + ver);
}

function MIDIAccess(sysex) {
  _readonly(this, 'inputs', []);
  _readonly(this, 'outputs', []);
  _readonly(this, 'sysexEnabled', sysex);
}

function DOMException(name, message, code) {
  this.name = name;
  this.message = message;
  this.code = code;
  Object.freeze(this);
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
  MidiSrc: MidiSrc,
  MidiDst: MidiDst,
  requestMIDIAccess: requestMIDIAccess
};

Object.defineProperty(WMT, 'midi', { get: function() { return _midi; }, set: function(b) { _midi = !!b; }, enumerable: true });
Object.defineProperty(WMT, 'sysex', { get: function() { return _sysex; }, set: function(b) { _sysex = !!b; }, enumerable: true });
Object.freeze(WMT);

module.exports = WMT;
