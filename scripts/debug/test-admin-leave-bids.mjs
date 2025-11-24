import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Opening admin dashboard first...');
  await page.goto('http://localhost:3000/dashboard', {
    waitUntil: 'networkidle0'
  });

  console.log('Waiting 2 seconds...');
  await page.waitForTimeout(2000);

  console.log('Now navigating to leave bid review page...');
  await page.goto('http://localhost:3000/dashboard/admin/leave-bids', {
    waitUntil: 'networkidle0'
  });

  console.log('Leave bid review page should be loaded!');
  console.log('Browser will remain open for inspection.');
})();
