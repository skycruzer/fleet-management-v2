import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  try {
    console.log('=== Testing Leave Bid Review Navigation ===\n');
    
    console.log('Step 1: Going to login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    console.log('Step 2: Waiting for form to load...');
    await page.waitForSelector('input#email', { timeout: 5000 });
    
    console.log('Step 3: Filling login form with credentials...');
    await page.type('input#email', 'skycruzer@icloud.com');
    await page.type('input#password', 'mron2393');
    
    console.log('Step 4: Clicking sign in button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    const afterLogin = page.url();
    console.log('Step 5: URL after login:', afterLogin);
    
    if (afterLogin.includes('/dashboard')) {
      console.log('✅ Login successful!\n');
      
      console.log('Step 6: Navigating to Leave Bid Review page...');
      await page.goto('http://localhost:3000/dashboard/admin/leave-bids', { 
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      if (finalUrl.includes('/dashboard/admin/leave-bids')) {
        console.log('\n✅ SUCCESS: Leave Bid Review page loaded correctly!');
        console.log('The navigation fix is working!\n');
        
        // Check if page content is visible
        const heading = await page.$('h1');
        if (heading) {
          const headingText = await page.evaluate(el => el.textContent, heading);
          console.log('Page heading:', headingText);
        }
      } else {
        console.log('\n❌ REDIRECT: Page redirected to:', finalUrl);
        console.log('The fix did not work as expected.\n');
      }
      
      console.log('\nBrowser will remain open for manual inspection.');
    } else {
      console.log('❌ Login failed - redirected to:', afterLogin);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('Current URL at error:', page.url());
  }
})();
