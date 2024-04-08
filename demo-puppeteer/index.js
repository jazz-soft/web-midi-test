const puppeteer = require('puppeteer');
const WMT =  require('web-midi-test');
const JZZ = require('jzz');
const JMH = require('jazz-midi-headless')(JZZ);
const url = 'file://' + __dirname + '/test.html';

const midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
const midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
const midi_in3 = new WMT.MidiSrc('VIRTUAL MIDI-In 3');
const midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
const midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
const midi_out3 = new WMT.MidiDst('VIRTUAL MIDI-Out 3');

midi_in3.busy = true;
midi_out3.busy = true;

midi_in1.connect();
midi_in2.connect();
midi_in3.connect();
midi_out1.connect();
midi_out2.connect();
midi_out3.connect();

midi_out1.receive = function(msg) { console.log('VIRTUAL MIDI-Out 1 received:', msg); };
midi_out2.receive = function(msg) { console.log('VIRTUAL MIDI-Out 2 received:', msg); };
midi_out3.receive = function(msg) { console.log('VIRTUAL MIDI-Out 3 received:', msg); };

global.navigator = WMT;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

(async () => {
  await JZZ({ engine: 'webmidi' });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('>>', msg.text()));
  await JMH.enable(page);
  await page.goto(url);
  await sleep(500);
  midi_in1.emit([0x90, 0x60, 0x7f]);
  midi_in2.emit([0x90, 0x60, 0x7f]);
  midi_in3.emit([0x90, 0x60, 0x7f]);
  await sleep(500);
  await browser.close().catch();
})();
