const playwright = require('playwright');
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
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    console.log('Testing on', browserType);
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', msg => {
      console.log('>>', msg.text());
    });
    await JMH.enable(page);
    await page.goto(url);
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
