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

  await page.click('[data-nav="6"]');
  // Capture mid-animation at multiple timestamps
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: 'anim-1-250ms.png', clip: { x: 0, y: 360, width: 480, height: 300 } });

  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: 'anim-2-500ms.png', clip: { x: 0, y: 360, width: 480, height: 300 } });

  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'anim-3-900ms.png', clip: { x: 0, y: 360, width: 480, height: 300 } });

  // Check the computed style of one bar
  const info = await page.evaluate(() => {
    const b = document.querySelector('#screen6 .bar');
    return {
      inline: b.style.height,
      computed: getComputedStyle(b).height,
      transition: getComputedStyle(b).transition,
    };
  });
  console.log(info);

  await browser.close();
})();
