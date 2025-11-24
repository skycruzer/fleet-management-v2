import { chromium } from '@playwright/test';

const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';

(async () => {
  console.log('📊 MANUAL REPORTS TESTING - Roster Period Format Verification');
  console.log('=' .repeat(80));
  console.log('This test will navigate through the reports feature and pause for inspection\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // Slow execution for manual observation
  });

  const page = await browser.newPage();

  try {
    // 1. Login
    console.log('1️⃣  Logging in to Admin Portal...');
    await page.goto('http://localhost:3000/auth/login', { timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.waitForTimeout(500);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForTimeout(5000);
    console.log('   ✅ Logged in successfully\n');

    // 2. Navigate to Reports
    console.log('2️⃣  Navigating to Reports Page...');
    await page.goto('http://localhost:3000/dashboard/reports', { timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/manual-01-reports-initial.png', fullPage: true });
    console.log('   ✅ Reports page loaded');
    console.log('   📸 Screenshot: manual-01-reports-initial.png\n');

    // 3. Check for roster period elements
    console.log('3️⃣  Analyzing roster period displays...');

    const bodyText = await page.locator('body').textContent();
    const rosterMatches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];

    if (rosterMatches.length > 0) {
      const unique = [...new Set(rosterMatches)].sort();
      console.log(`   Found ${unique.length} roster periods on page:`);

      let zeroPadded = 0;
      let nonPadded = 0;

      unique.forEach(period => {
        const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
        if (isZeroPadded) {
          zeroPadded++;
          console.log(`   ✅ ${period}`);
        } else {
          nonPadded++;
          console.log(`   ❌ ${period} (NOT zero-padded)`);
        }
      });

      console.log(`\n   Summary: ${zeroPadded} zero-padded, ${nonPadded} non-padded\n`);
    } else {
      console.log('   ℹ️  No roster periods found in initial page load');
      console.log('   (This is normal - periods may appear after selecting report type)\n');
    }

    // 4. Look for report type selectors
    console.log('4️⃣  Looking for report type options...');
    const buttons = await page.locator('button').all();
    const labels = await page.locator('label').all();

    console.log(`   Found ${buttons.length} buttons and ${labels.length} labels`);
    console.log('   📸 Check screenshot for report type selector UI\n');

    // 5. Manual inspection pause
    console.log('⏸️  MANUAL INSPECTION PHASE');
    console.log('=' .repeat(80));
    console.log('\n   The browser is now open for manual testing.');
    console.log('   Please test the following:\n');

    console.log('   📋 CHECKLIST:');
    console.log('   [ ] Check roster period checkboxes/filters - are they RP01/2026 format?');
    console.log('   [ ] Select "RDO/SDO" report type');
    console.log('   [ ] Select roster periods and click "Preview"');
    console.log('   [ ] Verify report data shows RP01/2026 format');
    console.log('   [ ] Select "Leave" report type');
    console.log('   [ ] Generate preview and check roster period format');
    console.log('   [ ] Select "All Requests" report type');
    console.log('   [ ] Generate preview and check roster period format');

    console.log('\n   Browser will remain open for 5 minutes for inspection.');
    console.log('   Close this terminal or press Ctrl+C when done.\n');

    // Wait 5 minutes for manual inspection
    await page.waitForTimeout(300000);  // 5 minutes

    console.log('\n✅ Manual inspection time complete.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/manual-error.png' });
  } finally {
    console.log('\n   Closing browser...');
    await browser.close();
    console.log('   Browser closed.\n');
  }
})();
