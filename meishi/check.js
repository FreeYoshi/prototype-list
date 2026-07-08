const p = require('puppeteer');
const path = require('path');
(async () => {
  const b = await p.launch({ headless: 'new' });
  const page = await b.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const fileUrl = 'file:///' + path.resolve('./index.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const info = await page.evaluate(() => {
    const el = document.querySelector('.phone');
    const rect = el.getBoundingClientRect();
    return {
      transform: el.style.transform,
      computedTransform: getComputedStyle(el).transform,
      rect: { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width },
      vh: window.innerHeight, vw: window.innerWidth,
      bodyOverflow: getComputedStyle(document.body).overflow,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})();
