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
    console.log('=== LEAVE BID SUBMISSION FLOW TEST ===\n');
    
    // ============================================
    // PART 1: PILOT PORTAL - SUBMIT LEAVE BID
    // ============================================
    console.log('PART 1: PILOT PORTAL - SUBMITTING LEAVE BID\n');
    
    console.log('Step 1: Going to pilot portal login page...');
    await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle0' });
    
    console.log('Step 2: Waiting for pilot login form...');
    await page.waitForSelector('input#email', { timeout: 5000 });
    
    console.log('Step 3: Logging in as pilot (mrondeau@airniugini.com.pg)...');
    await page.type('input#email', 'mrondeau@airniugini.com.pg');
    await page.type('input#password', 'Lemakot@1972');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    const pilotDashboardUrl = page.url();
    console.log('Step 4: Pilot logged in, URL:', pilotDashboardUrl);
    
    if (!pilotDashboardUrl.includes('/portal/dashboard')) {
      console.log('❌ Pilot login failed - redirected to:', pilotDashboardUrl);
      return;
    }
    
    console.log('✅ Pilot login successful!\n');
    
    // Navigate to leave requests page
    console.log('Step 5: Navigating to Leave Requests page...');
    await page.goto('http://localhost:3000/portal/leave-requests', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    console.log('Step 6: Looking for "New Leave Bid" or "Submit Leave Bid" button...');
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'pilot-leave-requests-page.png', fullPage: true });
    console.log('Screenshot saved: pilot-leave-requests-page.png');
    
    // Check for leave bid submission button
    const buttonSelectors = [
      'button:has-text("New Leave Bid")',
      'button:has-text("Submit Leave Bid")',
      'a:has-text("New Leave Bid")',
      'a:has-text("Submit Leave Bid")'
    ];
    
    let submitButton = null;
    for (const selector of buttonSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          console.log(`Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!submitButton) {
      console.log('⚠️  Could not find leave bid submission button automatically.');
      console.log('Please manually click the button to submit a leave bid.');
      console.log('\nWaiting 30 seconds for manual submission...');
      await page.waitForTimeout(30000);
    } else {
      console.log('Step 7: Clicking submit button...');
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Fill out the leave bid form
      console.log('Step 8: Filling out leave bid form...');
      // This will depend on your form structure - you may need to adjust selectors
      
      await page.screenshot({ path: 'leave-bid-form.png', fullPage: true });
      console.log('Screenshot saved: leave-bid-form.png');
      console.log('\nPlease fill out the form manually and submit.');
      console.log('Waiting 30 seconds...');
      await page.waitForTimeout(30000);
    }
    
    // ============================================
    // PART 2: ADMIN PORTAL - CHECK SUBMISSION
    // ============================================
    console.log('\n\nPART 2: ADMIN PORTAL - CHECKING SUBMISSION\n');
    
    console.log('Step 9: Logging out from pilot portal...');
    // Go to admin login
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    console.log('Step 10: Logging in as admin (skycruzer@icloud.com)...');
    await page.waitForSelector('input#email', { timeout: 5000 });
    
    // Clear any existing input
    await page.evaluate(() => {
      document.querySelector('input#email').value = '';
      document.querySelector('input#password').value = '';
    });
    
    await page.type('input#email', 'skycruzer@icloud.com');
    await page.type('input#password', 'mron2393');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    
    const adminDashboardUrl = page.url();
    console.log('Step 11: Admin logged in, URL:', adminDashboardUrl);
    
    if (!adminDashboardUrl.includes('/dashboard')) {
      console.log('❌ Admin login failed - redirected to:', adminDashboardUrl);
      return;
    }
    
    console.log('✅ Admin login successful!\n');
    
    // Navigate to leave bid review page
    console.log('Step 12: Navigating to Leave Bid Review page...');
    await page.goto('http://localhost:3000/dashboard/admin/leave-bids', { 
      waitUntil: 'networkidle0',
      timeout: 15000
    });
    
    console.log('Step 13: Checking for submitted leave bid...');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'admin-leave-bids-page.png', fullPage: true });
    console.log('Screenshot saved: admin-leave-bids-page.png');
    
    // Check pending bids count
    const pageContent = await page.content();
    
    if (pageContent.includes('Pending Review') || pageContent.includes('PENDING')) {
      console.log('✅ Found pending leave bids section!');
      
      // Try to find the specific bid from mrondeau
      if (pageContent.includes('mrondeau') || pageContent.includes('Rondeau')) {
        console.log('✅ Found bid from pilot mrondeau@airniugini.com.pg!');
      } else {
        console.log('⚠️  Could not find specific bid from mrondeau in page content.');
      }
    } else {
      console.log('⚠️  Could not find pending bids section.');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Browser will remain open for manual inspection.');
    console.log('Please verify:');
    console.log('1. The leave bid was submitted from pilot portal');
    console.log('2. The bid appears in the admin leave bid review page');
    console.log('3. The bid shows correct pilot information');
    console.log('4. You can approve/reject the bid from admin portal');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('Current URL at error:', page.url());
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved: error-screenshot.png');
  }
})();
