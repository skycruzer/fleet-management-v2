import puppeteer from 'puppeteer';

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      console.log('\n=== API RESPONSE ===');
      console.log('Status:', response.status());
      try {
        const text = await response.text();
        console.log('Response:', text);
      } catch (e) {
        console.log('Could not read response');
      }
    }
  });
  
  try {
    console.log('=== PILOT REGISTRATION TEST - MAURICE RONDEAU ===\n');
    
    console.log('Step 1: Navigating to registration page...');
    await page.goto('http://localhost:3000/portal/register', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    console.log('Step 2: Waiting for form to load...');
    await page.waitForSelector('input#first_name', { timeout: 5000 });
    await delay(1000); // Wait for React hydration
    
    console.log('\nStep 3: Filling out registration form...\n');
    
    // Personal Information
    console.log('Personal Information:');
    await page.type('input#first_name', 'Maurice');
    console.log('  ✓ First Name: Maurice');
    
    await page.type('input#last_name', 'Rondeau');
    console.log('  ✓ Last Name: Rondeau');
    
    // Rank - Try select first, then combobox
    console.log('  → Selecting Rank: Captain');
    const selectElement = await page.$('select#rank');
    if (selectElement) {
      await page.select('select#rank', 'Captain');
      console.log('  ✓ Rank: Captain (standard select)');
    } else {
      // Try shadcn/ui Select component
      try {
        await page.click('button[role="combobox"]');
        await delay(500);
        
        // Look for Captain option
        const captainOption = await page.$('[role="option"][data-value="Captain"]');
        if (captainOption) {
          await captainOption.click();
          console.log('  ✓ Rank: Captain (shadcn select)');
        } else {
          // Fallback: click by text content
          await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('[role="option"]'));
            const captain = options.find(opt => opt.textContent.trim() === 'Captain');
            if (captain) captain.click();
          });
          console.log('  ✓ Rank: Captain (text match)');
        }
      } catch (e) {
        console.log('  ⚠️  Could not select rank - may need manual selection');
      }
    }
    
    await delay(500);
    
    await page.type('input#employee_id', '2393');
    console.log('  ✓ Employee ID: 2393');
    
    // Optional fields - check if they exist
    const dobField = await page.$('input[name="date_of_birth"]');
    if (dobField) {
      await page.type('input[name="date_of_birth"]', '1972-10-06');
      console.log('  ✓ Date of Birth: 1972-10-06');
    }
    
    const phoneField = await page.$('input[name="phone_number"]');
    if (phoneField) {
      await page.type('input[name="phone_number"]', '+675814334414');
      console.log('  ✓ Phone: +675814334414');
    }
    
    const addressField = await page.$('input[name="address"]');
    if (addressField) {
      await page.type('input[name="address"]', 'Dakota');
      console.log('  ✓ Address: Dakota');
    }
    
    // Account Information
    console.log('\nAccount Information:');
    await page.type('input#email', 'mrondeau@airniugini.com.pg');
    console.log('  ✓ Email: mrondeau@airniugini.com.pg');
    
    await page.type('input#password', 'Lemakot@1972');
    console.log('  ✓ Password: Lemakot@1972');
    
    await page.type('input#confirmPassword', 'Lemakot@1972');
    console.log('  ✓ Confirm Password: Lemakot@1972');
    
    console.log('\nStep 4: Taking screenshot of completed form...');
    await page.screenshot({ path: 'maurice-registration-filled.png', fullPage: true });
    console.log('Screenshot saved: maurice-registration-filled.png');
    
    console.log('\nStep 5: Submitting registration...');
    await page.click('button[type="submit"]');
    
    console.log('Step 6: Waiting for response...');
    await delay(5000);
    
    console.log('\nStep 7: Checking result...');
    const pageContent = await page.content();
    const currentUrl = page.url();
    
    console.log('Current URL:', currentUrl);
    
    // Check for various success/error states
    if (pageContent.includes('Registration Submitted')) {
      console.log('\n✅ SUCCESS: Registration Submitted!');
      console.log('The form was successfully submitted and is awaiting admin approval.');
    } else if (pageContent.includes('successfully')) {
      console.log('\n✅ SUCCESS: Registration successful!');
    } else if (pageContent.includes('Awaiting admin approval')) {
      console.log('\n✅ SUCCESS: Awaiting admin approval!');
    } else if (pageContent.includes('Unable to submit')) {
      console.log('\n❌ ERROR: Unable to submit registration');
      console.log('The error message is displayed on the page.');
    } else if (pageContent.includes('already exists') || pageContent.includes('already registered')) {
      console.log('\n⚠️  NOTICE: Email already registered');
      console.log('The email mrondeau@airniugini.com.pg may already be in use.');
    } else if (currentUrl.includes('/portal/login')) {
      console.log('\n✅ SUCCESS: Redirected to login!');
      console.log('Registration successful - redirected to login page.');
    } else {
      console.log('\n⚠️  UNKNOWN STATE');
      console.log('Please check the browser window to see the current state.');
    }
    
    await page.screenshot({ path: 'maurice-registration-result.png', fullPage: true });
    console.log('\nScreenshot saved: maurice-registration-result.png');
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Browser will remain open for manual inspection.');
    console.log('\nRegistration Details Used:');
    console.log('  Name: Maurice Rondeau');
    console.log('  Email: mrondeau@airniugini.com.pg');
    console.log('  Employee ID: 2393');
    console.log('  Rank: Captain');
    console.log('  Password: Lemakot@1972');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'maurice-registration-error.png', fullPage: true });
    console.log('Error screenshot saved: maurice-registration-error.png');
  }
})();
