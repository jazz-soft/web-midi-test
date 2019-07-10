(function(global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  }
  else if (typeof define === 'function' && define.amd) {
    define('WMT', [], factory);
  }
  else {
    if (!global) global = window;
    global.WMT = factory();
  }
})(this, function() {

  function _readonly(obj, name, val) {
    Object.defineProperty(obj, name, { get: function() { return val; }, enumerable: true });
  }

  function _changed(target, data) {
    if (target.onstatechange) setTimeout(function() { target.onstatechange(new MIDIConnectionEvent(data)); }, 0);
  }

  function _noop() {}

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
        _Src[id] = { port: this, connected: false, busy: false, ports: [], pending: [] };
        break;
      }
    }
    Object.defineProperty(this, 'connected', { get: function() { return _Src[id].connected; }, enumerable: true });
    Object.defineProperty(this, 'busy', {
      get: function() { return _Src[id].busy; },
      set: function(b) {
        if (_Src[id].busy != !!b) {
          _Src[id].busy = !!b;
          if (_Src[id].busy) for (var i = 0; i < _Src[id].ports.length; i++) _Src[id].ports[i].close().then(_noop, _noop);
        }
      },
      enumerable: true
    });
    Object.freeze(this);
  }

  MidiSrc.prototype.connect = function() {
    if (!_Src[this.id].connected) {
      var i;
      _Src[this.id].connected = true;
      for (i = 0; i < _Src[this.id].ports.length; i++) _changed(_Src[this.id].ports[i], _Src[this.id].ports[i]);
      for (i = 0; i < _Acc.length; i++) _changed(_Acc[i], _Acc[i].inputs.get(this.id));
      if (_Src[this.id].busy) {
        for (i = 0; i < _Src[this.id].pending.length; i++) {
          _Src[this.id].pending[i][2](new DOMException('InvalidAccessError', 'Port is not available', 15));
        }
      }
      else {
        for (i = 0; i < _Src[this.id].pending.length; i++) {
          _Src[this.id].pending[i][1](_Src[this.id].pending[i][0]);
        }
      }
      _Src[this.id].pending = [];
    }
  }

  MidiSrc.prototype.disconnect = function() {
    if (_Src[this.id].connected) {
      var i;
      var x = [];
      for (i = 0; i < _Acc.length; i++) {
        x.push([_Acc[i], _Acc[i].inputs.get(this.id)]);
      }
      _Src[this.id].connected = false;
      for (i = 0; i < _Src[this.id].ports.length; i++) _changed(_Src[this.id].ports[i], _Src[this.id].ports[i]);
      for (i = 0; i < x.length; i++) _changed(x[i][0], x[i][1]);
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
        _Dst[id] = { port: this, connected: false, busy: false, ports: [], pending: [] };
        break;
      }
    }
    this.receive = _noop;
    Object.defineProperty(this, 'connected', { get: function() { return _Dst[id].connected; }, enumerable: true });
    Object.defineProperty(this, 'busy', {
      get: function() { return _Dst[id].busy; },
      set: function(b) {
        if (_Dst[id].busy != !!b) {
          _Dst[id].busy = !!b;
          if (_Dst[id].busy) for (var i = 0; i < _Dst[id].ports.length; i++) _Dst[id].ports[i].close().then(_noop, _noop);
        }
      },
      enumerable: true
    });
    Object.seal(this);
  }

  MidiDst.prototype.connect = function() {
    if (!_Dst[this.id].connected) {
      var i;
      _Dst[this.id].connected = true;
      for (i = 0; i < _Dst[this.id].ports.length; i++) _changed(_Dst[this.id].ports[i], _Dst[this.id].ports[i]);
      for (i = 0; i < _Acc.length; i++) _changed(_Acc[i], _Acc[i].outputs.get(this.id));
      if (_Dst[this.id].busy) {
        for (i = 0; i < _Dst[this.id].pending.length; i++) {
          _Dst[this.id].pending[i][2](new DOMException('InvalidAccessError', 'Port is not available', 15));
        }
      }
      else {
        for (i = 0; i < _Dst[this.id].pending.length; i++) {
          _Dst[this.id].pending[i][1](_Dst[this.id].pending[i][0]);
        }
      }
      _Dst[this.id].pending = [];
    }
  }

  MidiDst.prototype.disconnect = function() {
    if (_Dst[this.id].connected) {
      var i;
      var x = [];
      for (i = 0; i < _Acc.length; i++) {
        x.push([_Acc[i], _Acc[i].outputs.get(this.id)]);
      }
      _Dst[this.id].connected = false;
      for (i = 0; i < _Dst[this.id].ports.length; i++) _changed(_Dst[this.id].ports[i], _Dst[this.id].ports[i]);
      for (i = 0; i < x.length; i++) _changed(x[i][0], x[i][1]);
    }
  }

  function MIDIConnectionEvent(port) {
    this.port = port;
    Object.freeze(this);
  }

  function MIDIInput(access, port) {
    var self = this;
    var _open = false;
    var _onmidimessage = null;
    var _onstatechange = null;
    _readonly(this, 'type', 'input');
    _readonly(this, 'id', port.id);
    _readonly(this, 'name', port.name);
    _readonly(this, 'manufacturer', port.manufacturer);
    _readonly(this, 'version', port.version);
    this.open = function() {
      return new Promise((resolve, reject) => {
        if (port.connected) {
          if (!port.busy) {
            if (!_open) {
              _open = true;
              _changed(self, self);
              _changed(access, self);
            }
            resolve(self);
          }
          else {
            reject(new DOMException('InvalidAccessError', 'Port is not available', 15));
          }
        }
        else {
          if (!_open) {
            _open = true;
            _changed(self, self);
            _changed(access, self);
          }
          _Src[port.id].pending.push([self, resolve, reject]);
        }
      });
    };
    this.close = function() {
      _open = false;
      return new Promise((resolve, reject) => {
        var arr = [];
        for (var i = 0; i < _Src[port.id].pending.length; i++) {
          if (_Src[port.id].pending[i][0] != self) arr.push(_Src[port.id].pending[i]);
          else _Src[port.id].pending[i][2](new DOMException('InvalidAccessError', 'Port is closed', 15));
        }
        _Src[port.id].pending = arr;
        if (_open) {
          _open = false;
          _changed(self, self);
          _changed(access, self);
        }
        resolve(self);
      });
    };
    Object.defineProperty(this, 'state', {
      get: function() { return port.connected ? 'connected' : 'disconnected'; },
      enumerable: true
    });
    Object.defineProperty(this, 'connection', {
      get: function() { return port.connected ? _open && !port.busy ? 'open' : 'closed' : _open ? 'pending' : 'closed'; },
      enumerable: true
    });
    Object.defineProperty(this, 'onmidimessage', {
      get: function() { return _onmidimessage; },
      set: function(f) { if (!_open) self.open().then(_noop, _noop); _onmidimessage = f instanceof Function ? f : null; },
      enumerable: true
    });
    Object.defineProperty(this, 'onstatechange', {
      get: function() { return _onstatechange; },
      set: function(f) { _onstatechange = f instanceof Function ? f : null; },
      enumerable: true
    });
    Object.freeze(this);
  }

  function MIDIOutput(access, port) {
    var self = this;
    var _open = false;
    var _onstatechange = null;
    _readonly(this, 'type', 'output');
    _readonly(this, 'id', port.id);
    _readonly(this, 'name', port.name);
    _readonly(this, 'manufacturer', port.manufacturer);
    _readonly(this, 'version', port.version);
    this.send = function(arr) { if (!_open) self.open().then(_noop, _noop); port.receive(arr); };
    this.open = function() {
      return new Promise((resolve, reject) => {
        if (port.connected) {
          if (!port.busy) {
            if (!_open) {
              _open = true;
              _changed(self, self);
              _changed(access, self);
            }
            resolve(self);
          }
          else {
            reject(new DOMException('InvalidAccessError', 'Port is not available', 15));
          }
        }
        else {
          if (!_open) {
            _open = true;
            _changed(self, self);
            _changed(access, self);
          }
          _Dst[port.id].pending.push([self, resolve, reject]);
        }
      });
    };
    this.close = function() {
      this.clear();
      return new Promise((resolve, reject) => {
        var arr = [];
        for (var i = 0; i < _Dst[port.id].pending.length; i++) {
          if (_Dst[port.id].pending[i][0] != self) arr.push(_Dst[port.id].pending[i]);
          else _Dst[port.id].pending[i][2](new DOMException('InvalidAccessError', 'Port is closed', 15));
        }
        _Dst[port.id].pending = arr;
        if (_open) {
          _open = false;
          _changed(self, self);
          _changed(access, self);
        }
        resolve(self);
      });
    };
    this.clear = _noop;
    Object.defineProperty(this, 'state', {
      get: function() { return port.connected ? 'connected' : 'disconnected'; },
      enumerable: true
    });
    Object.defineProperty(this, 'connection', {
      get: function() { return port.connected ? _open && !port.busy ? 'open' : 'closed' : _open ? 'pending' : 'closed'; },
      enumerable: true
    });
    Object.defineProperty(this, 'onstatechange', {
      get: function() { return _onstatechange; },
      set: function(f) { _onstatechange = f instanceof Function ? f : null; },
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

  function MIDIInputMap(_access, _inputs) {
    this.get = function(id) {
      if (_Src.hasOwnProperty(id) && _Src[id].connected) {
        if (!_inputs[id]) {
          _inputs[id] = new MIDIInput(_access, _Src[id].port);
          _Src[id].ports.push(_inputs[id]);
        }
        return _inputs[id];
      }
    };
    Object.freeze(this);
  }

  MIDIInputMap.prototype = new _Maplike(_Src);
  MIDIInputMap.prototype.constructor = MIDIInputMap;

  function MIDIOutputMap(_access, _outputs) {
    this.get = function(id) {
      if (_Dst.hasOwnProperty(id) && _Dst[id].connected) {
        if (!_outputs[id]) {
          _outputs[id] = new MIDIOutput(_access, _Dst[id].port);
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
    var _onstatechange = null;
    var self = this;
    this.sysexEnabled = sysex;
    this.inputs = new MIDIInputMap(self, _inputs);
    this.outputs = new MIDIOutputMap(self, _outputs);
    Object.defineProperty(this, 'onstatechange', {
      get: function() { return _onstatechange; },
      set: function(f) { _onstatechange = f instanceof Function ? f : null; },
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

  return WMT;
});
