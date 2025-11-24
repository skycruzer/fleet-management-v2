import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Opening admin leave bid review page...');
  await page.goto('http://localhost:3000/dashboard/admin/leave-bids', {
    waitUntil: 'networkidle0'
  });

  console.log('Admin leave bid review page opened successfully!');
  console.log('Browser will remain open for preview.');
})();
