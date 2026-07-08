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

  // Tap 検索 nav item
  await page.click('[data-nav="5"]');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'tab-5-search.png' });
  console.log('search');

  // Scroll search to show more
  await page.evaluate(() => {
    document.querySelector('#screen5 .search-content').scrollTo({ top: 150, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'tab-5-search-scroll.png' });
  console.log('search scroll');

  // Scroll back to top
  await page.evaluate(() => {
    document.querySelector('#screen5 .search-content').scrollTo({ top: 0, behavior: 'instant' });
  });

  // Tap 分析
  await page.click('[data-nav="6"]');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'tab-6-analytics-anim.png' });
  console.log('analytics mid-animation');

  await new Promise(r => setTimeout(r, 1100));
  await page.screenshot({ path: 'tab-6-analytics.png' });
  console.log('analytics done');

  // Scroll analytics
  await page.evaluate(() => {
    document.querySelector('#screen6 .analytics-content').scrollTo({ top: 250, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'tab-6-analytics-scroll.png' });
  console.log('analytics scrolled');

  await page.evaluate(() => {
    document.querySelector('#screen6 .analytics-content').scrollTo({ top: 0, behavior: 'instant' });
  });

  // Tap 設定
  await page.click('[data-nav="7"]');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'tab-7-settings.png' });
  console.log('settings');

  await page.evaluate(() => {
    document.querySelector('#screen7 .settings-content').scrollTo({ top: 250, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'tab-7-settings-scroll.png' });
  console.log('settings scrolled');

  await page.evaluate(() => {
    document.querySelector('#screen7 .settings-content').scrollTo({ top: 500, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'tab-7-settings-bottom.png' });
  console.log('settings bottom');

  // Toggle a switch
  await page.evaluate(() => {
    document.querySelector('#screen7 .settings-content').scrollTo({ top: 200, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 200));
  // Tap the OFF toggle (週次レポート)
  await page.evaluate(() => {
    const toggles = document.querySelectorAll('#screen7 .toggle');
    toggles[toggles.length - 2].click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'tab-7-toggle.png' });
  console.log('settings toggle');

  // Back to home
  await page.click('[data-nav="0"]');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'tab-0-home-again.png' });
  console.log('home');

  await browser.close();
  console.log('Done.');
})();
