const puppeteer = require('puppeteer');
const url = 'file://' + __dirname + '/test.html';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto(url);

  //await browser.close();
})();
