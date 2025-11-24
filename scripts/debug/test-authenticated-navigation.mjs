import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  try {
    console.log('Step 1: Going to login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    console.log('Step 2: Filling login form...');
    await page.type('input[name="email"]', 'skycruzer@icloud.com');
    await page.type('input[name="password"]', 'P@ssw0rd123!');
    
    console.log('Step 3: Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Step 4: Current URL after login:', page.url());
    
    console.log('Step 5: Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    console.log('Current URL:', page.url());
    
    console.log('Step 6: Attempting to navigate to leave bid review...');
    await page.goto('http://localhost:3000/dashboard/admin/leave-bids', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    if (finalUrl.includes('/dashboard/admin/leave-bids')) {
      console.log('✅ SUCCESS: Leave bid review page loaded!');
    } else {
      console.log('❌ REDIRECT: Page redirected to:', finalUrl);
    }
    
    console.log('\nBrowser will remain open for inspection.');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('Current URL at error:', page.url());
  }
})();
