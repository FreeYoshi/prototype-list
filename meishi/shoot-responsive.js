const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

  // ---- Mobile: iPhone 12 / 13 / 14 size ----
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await m.screenshot({ path: 'resp-mobile-home.png' });
  console.log('mobile home');

  await m.click('#fabScan');
  await new Promise(r => setTimeout(r, 700));
  await m.screenshot({ path: 'resp-mobile-camera.png' });

  await m.click('#shutterBtn');
  await new Promise(r => setTimeout(r, 4200));
  await m.click('#nextBtn2');
  await new Promise(r => setTimeout(r, 700));
  await m.screenshot({ path: 'resp-mobile-insight.png' });
  console.log('mobile insight');

  await m.close();

  // ---- Small mobile: iPhone SE ----
  const se = await browser.newPage();
  await se.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await se.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await se.screenshot({ path: 'resp-mobile-se-home.png' });
  console.log('SE home');
  await se.close();

  // ---- Large mobile: iPhone 14 Pro Max ----
  const max = await browser.newPage();
  await max.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await max.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await max.screenshot({ path: 'resp-mobile-max-home.png' });
  console.log('Max home');
  await max.close();

  // ---- Desktop: still phone frame ----
  const d = await browser.newPage();
  await d.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await d.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await d.screenshot({ path: 'resp-desktop-home.png' });
  console.log('desktop home');
  await d.close();

  // ---- Small desktop window (height limited) ----
  const ds = await browser.newPage();
  await ds.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await ds.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await ds.screenshot({ path: 'resp-desktop-small-home.png' });
  console.log('desktop small home');
  await ds.close();

  await browser.close();
  console.log('Done.');
})();
