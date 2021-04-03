const puppeteer = require('puppeteer');
const WMT =  require('web-midi-test');
const url = 'file://' + __dirname + '/test.html';

var midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
var midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
var midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
var midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
midi_in1.connect();
midi_in2.connect();
midi_out1.connect();
midi_out2.connect();

function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text()));
  await page.exposeFunction('WMT_requestMIDIAccess', (arg) => { return WMT.requestMIDIAccess(arg); });
  page.evaluateOnNewDocument(() => { navigator.requestMIDIAccess = WMT_requestMIDIAccess; });

  await page.goto(url);

  await timeout(200);
  await browser.close();
})();
