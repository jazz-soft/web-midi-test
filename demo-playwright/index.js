const playwright = require('playwright');
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

(async () => {
  await JZZ({ engine: 'webmidi' });
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    console.log('Testing on', browserType);
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', msg => console.log('>>', msg.text()));
    await JMH.enable(page);
    await page.goto(url);
    await page.waitForTimeout(500);
    midi_in1.emit([0x90, 0x60, 0x7f]);
    midi_in2.emit([0x90, 0x60, 0x7f]);
    midi_in3.emit([0x90, 0x60, 0x7f]);
    await page.waitForTimeout(500);
    await browser.close();
  }
})();
