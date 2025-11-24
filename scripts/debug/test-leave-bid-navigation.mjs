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
  page.on('response', response => {
    if (response.url().includes('leave-bid')) {
      console.log('API RESPONSE:', response.url(), response.status());
    }
  });
  
  try {
    console.log('Step 1: Going to login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    console.log('Step 2: Waiting for form to load...');
    await page.waitForSelector('input#email', { timeout: 5000 });
    
    console.log('Step 3: Filling login form...');
    await page.type('input#email', 'skycruzer@icloud.com');
    await page.type('input#password', 'P@ssw0rd123!');
    
    console.log('Step 4: Clicking sign in button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    const afterLogin = page.url();
    console.log('Step 5: URL after login:', afterLogin);
    
    if (afterLogin.includes('/dashboard')) {
      console.log('✅ Login successful!');
      
      console.log('\nStep 6: Attempting to navigate to leave bid review...');
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
    } else {
      console.log('❌ Login failed - redirected to:', afterLogin);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('Current URL at error:', page.url());
  }
})();
