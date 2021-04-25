const puppeteer = require('puppeteer');
const WMT =  require('web-midi-test');
const JZZ = require('jzz');
const JMH = require('jazz-midi-headless')(JZZ);
const url = 'file://' + __dirname + '/test.html';

const midi_in1 = new WMT.MidiSrc('VIRTUAL MIDI-In 1');
const midi_in2 = new WMT.MidiSrc('VIRTUAL MIDI-In 2');
const midi_out1 = new WMT.MidiDst('VIRTUAL MIDI-Out 1');
const midi_out2 = new WMT.MidiDst('VIRTUAL MIDI-Out 2');
midi_in1.connect();
midi_in2.connect();
midi_out1.connect();
midi_out2.connect();

global.navigator = WMT;

(async () => {
  await JZZ({ engine: 'webmidi' });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text()));
  await JMH.enable(page);
  await page.goto(url);
  await page.waitForTimeout(1000);
  await browser.close().catch();
})();
