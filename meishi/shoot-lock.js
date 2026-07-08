const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 480, height: 900, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Initial: Face ID screen
  await page.screenshot({ path: 'lock-1-faceid.png' });
  console.log('1: face id');

  // 2. Tap to start scanning
  await page.click('#faceidTrigger');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'lock-2-scanning.png' });
  console.log('2: scanning');

  // 3. Wait for success
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: 'lock-3-success.png' });
  console.log('3: success');

  // 4. After fade to home
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'lock-4-home.png' });
  console.log('4: home after auth');

  // Reload to test PIN flow
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Switch to PIN
  await page.click('#switchToPinBtn');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'lock-5-pin-empty.png' });
  console.log('5: pin pad');

  // Enter 3 digits
  await page.click('.pin-key[data-digit="1"]');
  await new Promise(r => setTimeout(r, 100));
  await page.click('.pin-key[data-digit="2"]');
  await new Promise(r => setTimeout(r, 100));
  await page.click('.pin-key[data-digit="3"]');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'lock-6-pin-partial.png' });
  console.log('6: pin partial');

  // Enter remaining 3 digits
  await page.click('.pin-key[data-digit="4"]');
  await new Promise(r => setTimeout(r, 100));
  await page.click('.pin-key[data-digit="5"]');
  await new Promise(r => setTimeout(r, 100));
  await page.click('.pin-key[data-digit="6"]');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'lock-7-pin-checking.png' });
  console.log('7: pin checking');

  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'lock-8-pin-success.png' });
  console.log('8: pin success');

  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'lock-9-home-via-pin.png' });
  console.log('9: home via pin');

  await browser.close();
  console.log('Done.');
})();
