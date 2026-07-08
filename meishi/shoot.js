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

  // Screen 0: home
  await page.screenshot({ path: 'shot-0-home.png' });
  console.log('Shot 0: home');

  // Scroll list to see all items
  await page.evaluate(() => {
    document.querySelector('.list-section').scrollTo({ top: 80, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'shot-0b-home-scroll.png' });
  console.log('Shot 0b: home scrolled');

  await page.evaluate(() => {
    document.querySelector('.list-section').scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 200));

  // Tap an existing contact to demo direct-insight path
  await page.click('.contact-item[data-contact="2"]');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'shot-tap-existing.png' });
  console.log('Shot tap-existing: tapping registered card → insight');

  // Back to home
  await page.click('#screen3 .back-btn[data-back]');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'shot-back-home.png' });
  console.log('Shot back-home');

  // Tap FAB to start scan flow
  await page.click('#fabScan');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'shot-1-camera.png' });
  console.log('Shot 1: camera');

  // Tap shutter
  await page.click('#shutterBtn');
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: 'shot-2-extract.png' });
  console.log('Shot 2: extraction (mid progress)');

  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'shot-2b-extract-done.png' });
  console.log('Shot 2b: extraction done');

  await page.click('#nextBtn2');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'shot-3-insight.png' });
  console.log('Shot 3: insight');

  await page.evaluate(() => {
    document.querySelector('#screen3 .insight-scroll').scrollTo({ top: 200, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'shot-3b-insight-scroll.png' });
  console.log('Shot 3b: insight scrolled');

  await page.evaluate(() => {
    document.querySelector('#screen3 .insight-scroll').scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 200));

  await page.click('#nextBtn3');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'shot-4-script.png' });
  console.log('Shot 4: script');

  await page.click('#memoBtn');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'shot-4b-toast.png' });
  console.log('Shot 4b: toast');

  await browser.close();
  console.log('Done.');
})();
