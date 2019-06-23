function _readonly(obj, name, val) {
  Object.defineProperty(obj, name, { get: function() { return val; }, enumerable: true });
}

var _Acc = [];
var _Src = {};
var _Dst = {};

function MIDIMessageEvent(arr) {
  this.data = arr;
  Object.freeze(this);
}

function MidiSrc(name, man, ver) {
  if (!(this instanceof MidiSrc)) return new MidiSrc(name, man, ver);
  _readonly(this, 'name', '' + name);
  _readonly(this, 'manufacturer', '' + man);
  _readonly(this, 'version', '' + ver);
  var id;
  for (var n = 0; true; n++) {
    id = this.name + '/' + n;
    if (!_Src[id]) {
      _readonly(this, 'id', id);
      _Src[id] = { port: this, connected: false, ports: [] };
      break;
    }
  }
  Object.defineProperty(this, 'connected', { get: function() { return _Src[id].connected; }, enumerable: true });
  Object.defineProperty(this, 'busy', { get: function() { return !!_Src[id].busy; }, set: function(b) { _Src[id].busy = !!b; }, enumerable: true });
  Object.freeze(this);
}

MidiSrc.prototype.connect = function() {
  if (!_Src[this.id].connected) {
    _Src[this.id].connected = true;
    for (var i = 0; i < _Acc.length; i++) {
      if (_Acc[i].onstatechange) {
        var evt = new MIDIConnectionEvent(_Acc[i], this);
        _Acc[i].onstatechange(evt);
      }
    }
  }
}

MidiSrc.prototype.disconnect = function() {
  if (_Src[this.id].connected) {
    _Src[this.id].connected = false;
    for (var i = 0; i < _Acc.length; i++) {
      if (_Acc[i].onstatechange) {
        var evt = new MIDIConnectionEvent(_Acc[i], this);
        _Acc[i].onstatechange(evt);
      }
    }
  }
}

MidiSrc.prototype.emit = function(arr) {
  for (var i = 0; i < _Src[this.id].ports.length; i++) {
    if (_Src[this.id].ports[i].onmidimessage && _Src[this.id].ports[i].connection == 'open') {
      _Src[this.id].ports[i].onmidimessage(new MIDIMessageEvent(arr));
    }
  }
}

function MidiDst(name, man, ver) {
  if (!(this instanceof MidiDst)) return new MidiDst(name, man, ver);
  _readonly(this, 'name', '' + name);
  _readonly(this, 'manufacturer', '' + man);
  _readonly(this, 'version', '' + ver);
  var id;
  for (var n = 0; true; n++) {
    id = this.name + '/' + n;
    if (!_Dst[id]) {
      _readonly(this, 'id', id);
      _Dst[id] = { port: this, connected: false, ports: [] };
      break;
    }
  }
  this.receive = _doNothing;
  Object.defineProperty(this, 'connected', { get: function() { return _Dst[id].connected; }, enumerable: true });
  Object.defineProperty(this, 'busy', { get: function() { return !!_Dst[id].busy; }, set: function(b) { _Dst[id].busy = !!b; }, enumerable: true });
  Object.seal(this);
}

MidiDst.prototype.connect = function() {
  if (!_Dst[this.id].connected) {
    _Dst[this.id].connected = true;
    for (var i = 0; i < _Acc.length; i++) {
      if (_Acc[i].onstatechange) {
        var evt = new MIDIConnectionEvent(_Acc[i], this);
        _Acc[i].onstatechange(evt);
      }
    }
  }
}

MidiDst.prototype.disconnect = function() {
  if (_Dst[this.id].connected) {
    _Dst[this.id].connected = false;
    for (var i = 0; i < _Acc.length; i++) {
      if (_Acc[i].onstatechange) {
        var evt = new MIDIConnectionEvent(_Acc[i], this);
        _Acc[i].onstatechange(evt);
      }
    }
  }
}

function _doNothing() {}

function MIDIConnectionEvent(access, connection) {
}

function MIDIInput(port) {
  var _open = true;
  var _onmidimessage;
  var _onstatechange;
  _readonly(this, 'type', 'input');
  _readonly(this, 'id', port.id);
  _readonly(this, 'name', port.name);
  _readonly(this, 'manufacturer', port.manufacturer);
  _readonly(this, 'version', port.version);
  this.open = function() {
    var self = this;
    _open = true;
    return new Promise((resolve, reject) => {
      if (!port.connected) reject(new DOMException('InvalidAccessError', 'Port is not connected', 15));
      else if (port.busy) reject(new DOMException('InvalidAccessError', 'Port is busy', 15));
      else resolve(self);
    });
  };
  this.close = function() {
    var self = this;
    _open = false;
    return new Promise((resolve, reject) => { resolve(self);});
  };
  Object.defineProperty(this, 'state', {
    get: function() { return port.connected ? 'connected' : 'disconnected'; },
    enumerable: true
  });
  Object.defineProperty(this, 'connection', {
    get: function() { return port.connected && !port.busy && _open ? 'open' : 'closed'; },
    enumerable: true
  });
  Object.defineProperty(this, 'onmidimessage', {
    get: function() { return _onmidimessage; },
    set: function(f) { _open = true; _onmidimessage = f instanceof Function ? f : undefined; },
    enumerable: true
  });
  Object.defineProperty(this, 'onstatechange', {
    get: function() { return _onstatechange; },
    set: function(f) { _onstatechange = f instanceof Function ? f : undefined; },
    enumerable: true
  });
  Object.freeze(this);
}

function MIDIOutput(port) {
  var _open = true;
  var _onstatechange;
  _readonly(this, 'type', 'output');
  _readonly(this, 'id', port.id);
  _readonly(this, 'name', port.name);
  _readonly(this, 'manufacturer', port.manufacturer);
  _readonly(this, 'version', port.version);
  this.send = function(arr) { _open = true; port.receive(arr); };
  this.open = function() {
    var self = this;
    _open = true;
    return new Promise((resolve, reject) => {
      if (!port.connected) reject(new DOMException('InvalidAccessError', 'Port is not connected', 15));
      else if (port.busy) reject(new DOMException('InvalidAccessError', 'Port is busy', 15));
      else resolve(self);
    });
  };
  this.close = function() {
    var self = this;
    _open = false;
    return new Promise((resolve, reject) => { resolve(self);});
  };
  this.clear = _doNothing;
  Object.defineProperty(this, 'state', {
    get: function() { return port.connected ? 'connected' : 'disconnected'; },
    enumerable: true
  });
  Object.defineProperty(this, 'connection', {
    get: function() { return port.connected && !port.busy && _open ? 'open' : 'closed'; },
    enumerable: true
  });
  Object.defineProperty(this, 'onstatechange', {
    get: function() { return _onstatechange; },
    set: function(f) { _onstatechange = f instanceof Function ? f : undefined; },
    enumerable: true
  });
  Object.freeze(this);
}

function _Maplike(data) {
  this.has = function(id) {
    return data.hasOwnProperty(id) && data[id].connected;
  };
  this.keys = function() {
    var out = [];
    for (var id in data) if (this.has(id)) out.push(id);
    return out;
  };
  this.values = function() {
    var out = [];
    for (var id in data) if (this.has(id)) out.push(this.get(id));
    return out;
  };
  this.entries = function() {
    var out = [];
    for (var id in data) if (this.has(id)) out.push([id, this.get(id)]);
    return out;
  };
  this.forEach = function(fun, self) {
    if (typeof self == 'undefined') self = this;
    for (var id in data) if (this.has(id)) fun.call(self, this.get(id), id, this);
  };
  Object.defineProperty(this, 'size', {
    get: function() { return this.keys().length; },
    enumerable: true
  });
}

function MIDIInputMap(_inputs) {
  this.get = function(id) {
    if (_Src.hasOwnProperty(id) && _Src[id].connected) {
      if (!_inputs[id]) {
        _inputs[id] = new MIDIInput(_Src[id].port);
        _Src[id].ports.push(_inputs[id]);
      }
      return _inputs[id];
    }
  };
  Object.freeze(this);
}

MIDIInputMap.prototype = new _Maplike(_Src);
MIDIInputMap.prototype.constructor = MIDIInputMap;

function MIDIOutputMap(_outputs) {
  this.get = function(id) {
    if (_Dst.hasOwnProperty(id) && _Dst[id].connected) {
      if (!_outputs[id]) {
        _outputs[id] = new MIDIOutput(_Dst[id].port);
        _Dst[id].ports.push(_outputs[id]);
      }
      return _outputs[id];
    }
  };
  Object.freeze(this);
}

MIDIOutputMap.prototype = new _Maplike(_Dst);
MIDIOutputMap.prototype.constructor = MIDIOutputMap;

function MIDIAccess(sysex) {
  var _inputs = {};
  var _outputs = {};
  var _onstatechange;
  this.sysexEnabled = sysex;
  this.inputs = new MIDIInputMap(_inputs);
  this.outputs = new MIDIOutputMap(_outputs);
  Object.defineProperty(this, 'onstatechange', {
    get: function() { return _onstatechange; },
    set: function(f) { _onstatechange = f instanceof Function ? f : undefined; },
    enumerable: true
  });
  Object.freeze(this);
  _Acc.push(this);
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
