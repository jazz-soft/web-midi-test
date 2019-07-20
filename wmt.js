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

  var _time = Date.now || function () { return new Date().getTime(); };
  var _startTime = _time();
  var _now = typeof performance != 'undefined' && performance.now ?
    function() { return performance.now(); } : function() { return _time() - _startTime; };

  var _Acc = [];
  var _Src = {};
  var _Dst = {};
  var _heap = [];
  var _interval;

  function _insert(x) {
    var k;
    var n = _heap.length;
    _heap.push(x);
    while(n) {
      k = Math.floor((n - 1) / 2);
      if (_heap[k][0] > x[0]) {
        _heap[n] = _heap[k];
        _heap[k] = x;
        n = k;
      }
      else break;
    }
    if (_heap.length == 1) {
      _interval = setInterval(_tick, 1);
    }
  }

  function _remove(i) {
    var n = _heap.length - 1;
    var x = _heap[n];
    _heap.length = n;
    if (i < n) {
      _heap[i] = x;
      while (true) {
        n = i * 2 + 2;
        if (n < _heap.length && _heap[n][0] < _heap[n - 1][0] && _heap[n][0] < _heap[i][0]) {
          _heap[i] = _heap[n];
          _heap[n] = x;
          i = n;
        }
        else {
          n--;
          if (n < _heap.length && _heap[n][0] < _heap[i][0]) {
            _heap[i] = _heap[n];
            _heap[n] = x;
            i = n;
          }
          else break;
        }
      }
    }
    if (!_heap.length) clearInterval(_interval);
  }

  function _tick() {
    while (_heap.length && _heap[0][0] <= _now()) {
      if (_heap[0][2].connected) _heap[0][2].receive(_heap[0][3])
      _remove(0);
    }
  }

  function MIDIMessageEvent(data) {
    this.data = new Uint8Array(data);
    this.timeStamp = _now();
    Object.freeze(this);
  }

  function _split(q) {
    var i, k;
    while (q.length) {
      for (i = 0; i < q.length; i++) if (q[i] == parseInt(q[i]) && q[i] >= 0x80 && q[i] <= 0xff && q[i] != 0xf7) break;
      q.splice(0, i);
      if (!q.length) return;
      if (q[0] == 0xf0) {
        for (i = 1; i < q.length; i++) if (q[i] == 0xf7) break;
        if (i == q.length) return;
        return q.splice(0, i + 1);
      }
      else {
        k = _datalen(q[0]) + 1;
        if (k > q.length) return;
        for (i = 1; i < k; i++) if (q[i] != parseInt(q[i]) || q[i] < 0 || q[i] >= 0x80) break;
        if (i == k) return q.splice(0, i);
        else q.splice(0, i);
      }
    }
  }

  function MidiSrc(name, man, ver) {
    if (!(this instanceof MidiSrc)) return new MidiSrc(name, man, ver);
    _readonly(this, 'name', '' + name);
    _readonly(this, 'manufacturer', '' + man);
    _readonly(this, 'version', '' + ver);
    var id;
    var _queue = [];
    for (var n = 0; true; n++) {
      id = this.name + '/' + n;
      if (!_Src[id]) {
        _readonly(this, 'id', id);
        _Src[id] = { port: this, connected: false, busy: false, ports: [], pending: [] };
        break;
      }
    }
    this.emit = function(arr) {
      var i, p, msg;
      _queue = _queue.concat(arr);
      for (msg = _split(_queue); msg; msg = _split(_queue)) {
        for (i = 0; i < _Acc.length; i++) {
          if (msg[0] != 0xf0 || _Acc[i].sysexEnabled) {
            p = _Acc[i].inputs.get(id);
            if (p.onmidimessage && p.connection == 'open') p.onmidimessage(new MIDIMessageEvent(msg));
          }
        }
      }
    };
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

  function _datalen(x) {
    if (x >= 0x80 && x <= 0xbf || x >= 0xe0 && x <= 0xef || x == 0xf2) return 2;
    if (x >= 0xc0 && x <= 0xdf || x == 0xf1 || x == 0xf3) return 1;
    return 0;
  }

  var _epr = "Failed to execute 'send' on 'MIDIOutput': ";

  function _validate(arr, sysex) {
    var i, k;
    var msg;
    var data = [];
    for (i = 0; i < arr.length; i++) {
      if (arr[i] != parseInt(arr[i]) || arr[i] < 0 || arr[i] > 255) throw TypeError(_epr + arr[i] + ' is not a UInt8 value.');
    }
    k = 0;
    for (i = 0; i < arr.length; i++) {
      if (!k) {
        if (arr[i] < 0x80) throw TypeError(_epr + 'Running status is not allowed at index ' + i + ' (' + arr[i] + ').');
        if (arr[i] == 0xf7) throw TypeError(_epr + 'Unexpected end of system exclusive message at index ' + i + ' (' + arr[i] + ').');
        msg = [arr[i]];
        data.push(msg);
        if (arr[i] == 0xf0) {
          if (!sysex) throw new DOMException('InvalidAccessError', _epr + 'System exclusive messag is not allowed at index ' + i + ' (' + arr[i] + ').', 15);
          k = -1;
          for (; i < arr.length; i++) {
            msg.push(arr[i]);
            if (arr[i] == 0xf7) {
              k = 0;
              break;
            }
          }
        }
        else {
          k = _datalen(arr[i]);
        }
      }
      else {
        if (arr[i] > 0x7f) throw TypeError(_epr + 'Unexpected status byte at index ' + i + ' (' + arr[i] + ').');
        msg.push(arr[i]);
        k--;
      }
    }
    if (k) throw TypeError(_epr + 'Message is incomplete');
    return [data];
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
    this.send = function(arr, t) {
      var data = _validate(arr, access.sysexEnabled);
      if (!port.connected) throw new DOMException('InvalidStateError', 'Port is not connected', 11);
      if (!_open) self.open().then(_noop, _noop);
      var i;
      if (t > _now()) for (i = 0; i < data.length; i++) _insert([t, this, port, data[i]]);
      else for (i = 0; i < data.length; i++) port.receive(data[i]);
    };
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
    this.clear = function() {
      for (var i = _heap.length - 1; i >= 0; i--) if (_heap[i][1] == this) _remove(i);
    };
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
      var m = new Map();
      for (var id in data) if (this.has(id)) m.set(id, this.get(id));
      return m.keys();
    };
    this.values = function() {
      var m = new Map();
      for (var id in data) if (this.has(id)) m.set(id, this.get(id));
      return m.values();
    };
    this.entries = function() {
      var m = new Map();
      for (var id in data) if (this.has(id)) m.set(id, this.get(id));
      return m.entries();
    };
    this.forEach = function(fun, self) {
      if (typeof self == 'undefined') self = this;
      for (var id in data) if (this.has(id)) fun.call(self, this.get(id), id, this);
    };
    Object.defineProperty(this, 'size', {
      get: function() {
        var len = 0;
        for (var id in data) if (this.has(id)) len++;
        return len;
      },
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
  Object.defineProperty(WMT, 'now', { get: function() { return _now; }, set: function(f) { _now = f; }, enumerable: true });
  Object.freeze(WMT);

  return WMT;
});
