import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Opening pilot portal leave requests page...');
  await page.goto('http://localhost:3000/portal/leave-requests', {
    waitUntil: 'networkidle0'
  });

  console.log('Leave requests page opened. Click "New Leave Request" to test auto-calculated roster period.');
  console.log('Browser will remain open for testing.');
})();
