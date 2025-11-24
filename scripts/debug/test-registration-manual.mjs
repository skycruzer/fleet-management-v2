import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Opening pilot registration page for manual testing...');
  console.log('Navigate to: http://localhost:3000/portal/register');
  console.log('\nPlease:');
  console.log('1. Fill out the form with test data');
  console.log('2. Click "Register" button');
  console.log('3. Check if success message appears');
  console.log('4. Check if you get redirected to login');
  console.log('\nBrowser will remain open for testing.');
  
  await page.goto('http://localhost:3000/portal/register', {
    waitUntil: 'networkidle0'
  });
})();
