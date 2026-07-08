const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 480, height: 900, deviceScaleFactor: 2 }
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

  // Clear localStorage to start fresh
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Auth
  await page.click('#faceidTrigger');
  await new Promise(r => setTimeout(r, 2500));

  // Tap Sato Kenichi (contact 1)
  await page.click('.contact-item[data-contact="1"]');
  await new Promise(r => setTimeout(r, 800));

  // Scroll to memo section
  await page.evaluate(() => {
    const sec = document.querySelector('#screen3 .memo-section');
    sec.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'memo-1-existing.png' });
  console.log('1: existing memos for Sato');

  // Type a new memo
  await page.focus('#memoInput');
  await page.type('#memoInput', '次回ミーティングは6月15日 14時。会議室Aで実施。事前にRFP資料を共有しておく。');
  await new Promise(r => setTimeout(r, 200));

  // Select tags
  await page.click('.memo-tag-chip[data-tag="ToDo"]');
  await new Promise(r => setTimeout(r, 100));
  await page.click('.memo-tag-chip[data-tag="提案"]');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'memo-2-typing.png' });
  console.log('2: typing new memo with tags');

  // Save
  await page.click('#memoSaveBtn');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'memo-3-saved.png' });
  console.log('3: saved with toast');

  // Wait for toast to fade
  await new Promise(r => setTimeout(r, 1700));
  await page.screenshot({ path: 'memo-4-list.png' });
  console.log('4: full list with new memo');

  // Go back to home
  await page.click('#screen3 .back-btn[data-back]');
  await new Promise(r => setTimeout(r, 700));

  // Tap Tanaka Misaki (contact 2) - has 1 pre-existing memo
  await page.click('.contact-item[data-contact="2"]');
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    document.querySelector('#screen3 .memo-section').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'memo-5-different-contact.png' });
  console.log('5: different contact has different memos');

  // Tap Yamada (no memos - empty state)
  await page.click('#screen3 .back-btn[data-back]');
  await new Promise(r => setTimeout(r, 700));
  await page.click('.contact-item[data-contact="3"]');
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    document.querySelector('#screen3 .memo-section').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'memo-6-empty.png' });
  console.log('6: empty memo state');

  await browser.close();
  console.log('Done.');
})();
