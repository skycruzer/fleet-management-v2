import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Enable detailed logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('response', async response => {
    if (response.url().includes('/api/portal/register')) {
      console.log('API RESPONSE:', response.url(), response.status());
      try {
        const json = await response.json();
        console.log('API RESPONSE BODY:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
  });
  
  try {
    console.log('=== PILOT REGISTRATION TEST (SHADCN UI) ===\n');
    
    const timestamp = Date.now();
    const testEmail = `test.pilot.${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('Step 1: Navigating to registration page...');
    await page.goto('http://localhost:3000/portal/register', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    console.log('Step 2: Waiting for form to load...');
    await page.waitForSelector('input#first_name', { timeout: 5000 });
    await page.waitForTimeout(1000); // Extra wait for React hydration
    
    console.log('Step 3: Filling out ALL form fields...');
    
    // First Name
    await page.type('input#first_name', 'Test');
    console.log('  ✓ First name: Test');
    
    // Last Name
    await page.type('input#last_name', `Pilot${timestamp}`);
    console.log(`  ✓ Last name: Pilot${timestamp}`);
    
    // Rank - Click the Select trigger to open dropdown
    console.log('  → Selecting rank...');
    await page.click('button[role="combobox"]'); // shadcn Select trigger
    await page.waitForTimeout(500);
    
    // Click "Captain" option
    const captainOption = await page.waitForSelector('[role="option"][data-value="Captain"]', { timeout: 3000 });
    if (captainOption) {
      await captainOption.click();
      console.log('  ✓ Rank: Captain');
    } else {
      // Fallback: try clicking by text
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        const captain = options.find(opt => opt.textContent.includes('Captain'));
        if (captain) captain.click();
      });
      console.log('  ✓ Rank: Captain (fallback)');
    }
    
    await page.waitForTimeout(500);
    
    // Employee ID (optional)
    await page.type('input#employee_id', `EMP${timestamp}`);
    console.log(`  ✓ Employee ID: EMP${timestamp}`);
    
    // Email
    await page.type('input#email', testEmail);
    console.log(`  ✓ Email: ${testEmail}`);
    
    // Password
    await page.type('input#password', testPassword);
    console.log(`  ✓ Password: ${testPassword}`);
    
    // Confirm Password
    await page.type('input#confirmPassword', testPassword);
    console.log(`  ✓ Confirm Password: ${testPassword}`);
    
    console.log('\nStep 4: Taking screenshot of filled form...');
    await page.screenshot({ path: 'registration-form-filled.png', fullPage: true });
    console.log('Screenshot saved: registration-form-filled.png');
    
    console.log('\nStep 5: Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    console.log('Step 6: Waiting for API response...');
    await page.waitForTimeout(5000);
    
    console.log('\nStep 7: Checking page content...');
    const pageContent = await page.content();
    
    if (pageContent.includes('Registration Submitted')) {
      console.log('✅ SUCCESS: Registration Submitted heading found!');
    } else if (pageContent.includes('successfully')) {
      console.log('✅ SUCCESS: Success message found!');
    } else if (pageContent.includes('Awaiting admin approval')) {
      console.log('✅ SUCCESS: Awaiting approval message found!');
    } else if (pageContent.includes('submitted for admin approval')) {
      console.log('✅ SUCCESS: Admin approval message found!');
    } else {
      console.log('❌ FAILED: No success message found');
      
      // Check for error messages
      if (pageContent.includes('Unable to submit')) {
        console.log('❌ ERROR: "Unable to submit registration" message displayed');
      }
      if (pageContent.includes('Please check your information')) {
        console.log('❌ ERROR: "Please check your information" message displayed');
      }
      if (pageContent.includes('failed')) {
        console.log('❌ ERROR: Failure message found in content');
      }
    }
    
    await page.screenshot({ path: 'registration-result.png', fullPage: true });
    console.log('Screenshot saved: registration-result.png');
    
    console.log('\n=== TEST COMPLETE ===');
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${testPassword}`);
    console.log('Browser will remain open for inspection.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('Current URL at error:', page.url());
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('Error screenshot saved: test-error.png');
  }
})();
