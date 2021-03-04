const WMT = require('web-midi-test');
const navigator = { requestMIDIAccess: WMT.requestMIDIAccess };
const source = new WMT.MidiSrc('VIRTUAL MIDI-In');
source.connect();

const list = [
  [144, 60, 127], [128, 60, 0], [144, 64, 127], [128, 64, 0]
];
function nextMidi() {
  source.emit(list.shift());
  if (list.length) setTimeout(nextMidi, 1000);
}

function onFail() { console.error('Oops...'); }
function onSuccess(midiAccess) {
  midiAccess.inputs.forEach(function(port) {
    console.log(port.name + ' is open!');
    port.onmidimessage = function(msg) {
      console.log(port.name + ': ' + msg.data);
    };
  });
  setTimeout(nextMidi, 1000);
}

navigator.requestMIDIAccess().then(onSuccess, onFail);
