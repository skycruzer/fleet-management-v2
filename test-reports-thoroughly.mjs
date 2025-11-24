import { chromium } from '@playwright/test';

const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';

async function checkRosterPeriodsInElement(page, selector, elementName) {
  console.log(`\n   🔍 Checking ${elementName}...`);

  try {
    const element = page.locator(selector);
    const count = await element.count();

    if (count === 0) {
      console.log(`      No ${elementName} found`);
      return { zeroPadded: 0, nonPadded: 0 };
    }

    const text = await element.textContent();
    const matches = text.match(/RP\d{1,2}\/\d{4}/g) || [];

    if (matches.length > 0) {
      const unique = [...new Set(matches)];
      let zeroPadded = 0;
      let nonPadded = 0;

      unique.forEach(period => {
        if (period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/)) {
          zeroPadded++;
          console.log(`      ✅ ${period}`);
        } else if (period.match(/RP[1-9]\/\d{4}/)) {
          nonPadded++;
          console.log(`      ❌ ${period} (NOT zero-padded)`);
        }
      });

      return { zeroPadded, nonPadded };
    }
  } catch (error) {
    console.log(`      Error checking ${elementName}: ${error.message}`);
  }

  return { zeroPadded: 0, nonPadded: 0 };
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📊 THOROUGH REPORTS FEATURE TESTING');
  console.log('   Focus: Roster Period Format Verification');
  console.log('=' .repeat(80));

  let totalZeroPadded = 0;
  let totalNonPadded = 0;

  try {
    // Login
    console.log('\n1️⃣  Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.waitForTimeout(500);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForTimeout(5000);
    console.log('   ✅ Logged in');

    // Navigate to Reports
    console.log('\n2️⃣  Navigating to Reports Page...');
    await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/reports-01-initial.png', fullPage: true });
    console.log('   ✅ Reports page loaded');

    // Test 1: Check roster period dropdowns/selectors
    console.log('\n3️⃣  Testing Roster Period Selectors...');

    // Look for roster period checkboxes/options
    const labels = await page.locator('label').all();
    console.log(`   Found ${labels.length} labels on page`);

    for (const label of labels) {
      const text = await label.textContent();
      if (text && text.match(/RP\d{1,2}\/\d{4}/)) {
        const isZeroPadded = text.match(/RP0[1-9]\/\d{4}/) || text.match(/RP1[0-3]\/\d{4}/);
        if (isZeroPadded) {
          totalZeroPadded++;
          console.log(`   ✅ ${text.trim()}`);
        } else {
          totalNonPadded++;
          console.log(`   ❌ ${text.trim()} (NOT zero-padded)`);
        }
      }
    }

    // Test 2: Select RDO/SDO Report Type
    console.log('\n4️⃣  Testing RDO/SDO Report...');
    try {
      // Look for report type selector
      const rdoSdoButton = page.locator('text=RDO/SDO').or(page.locator('text=rdo-sdo')).or(page.locator('[value="rdo-sdo"]'));
      await rdoSdoButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/reports-02-rdo-sdo-selected.png', fullPage: true });
      console.log('   ✅ RDO/SDO report type selected');

      // Try to generate preview
      const previewButton = page.getByRole('button', { name: /preview|generate/i });
      if (await previewButton.count() > 0) {
        await previewButton.first().click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-screenshots/reports-03-rdo-sdo-preview.png', fullPage: true });
        console.log('   ✅ RDO/SDO report preview generated');

        // Check preview for roster periods
        const previewStats = await checkRosterPeriodsInElement(page, 'body', 'Preview Content');
        totalZeroPadded += previewStats.zeroPadded;
        totalNonPadded += previewStats.nonPadded;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not test RDO/SDO report: ${error.message}`);
    }

    // Test 3: Select Leave Report Type
    console.log('\n5️⃣  Testing Leave Report...');
    try {
      await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);

      const leaveButton = page.locator('text=Leave').or(page.locator('[value="leave"]'));
      await leaveButton.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/reports-04-leave-selected.png', fullPage: true });
      console.log('   ✅ Leave report type selected');

      // Select a roster period if available
      const rosterPeriodCheckboxes = page.locator('input[type="checkbox"]').filter({ hasText: /RP\d{2}\/\d{4}/ });
      const checkboxCount = await rosterPeriodCheckboxes.count();

      if (checkboxCount > 0) {
        console.log(`   Found ${checkboxCount} roster period checkboxes`);
        // Select first few roster periods
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await rosterPeriodCheckboxes.nth(i).check();
          await page.waitForTimeout(500);
        }
        await page.screenshot({ path: 'test-screenshots/reports-05-roster-periods-selected.png', fullPage: true });
      }

      // Generate preview
      const previewButton = page.getByRole('button', { name: /preview|generate/i });
      if (await previewButton.count() > 0) {
        await previewButton.first().click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-screenshots/reports-06-leave-preview.png', fullPage: true });
        console.log('   ✅ Leave report preview generated');

        const previewStats = await checkRosterPeriodsInElement(page, 'body', 'Preview Content');
        totalZeroPadded += previewStats.zeroPadded;
        totalNonPadded += previewStats.nonPadded;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not test Leave report: ${error.message}`);
    }

    // Test 4: Test All Requests Report
    console.log('\n6️⃣  Testing All Requests Report...');
    try {
      await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);

      const allRequestsButton = page.locator('text=All Requests').or(page.locator('[value="all-requests"]'));
      if (await allRequestsButton.count() > 0) {
        await allRequestsButton.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-screenshots/reports-07-all-requests-selected.png', fullPage: true });
        console.log('   ✅ All Requests report type selected');

        const previewButton = page.getByRole('button', { name: /preview|generate/i });
        if (await previewButton.count() > 0) {
          await previewButton.first().click();
          await page.waitForTimeout(5000);
          await page.screenshot({ path: 'test-screenshots/reports-08-all-requests-preview.png', fullPage: true });
          console.log('   ✅ All Requests report preview generated');

          const previewStats = await checkRosterPeriodsInElement(page, 'body', 'Preview Content');
          totalZeroPadded += previewStats.zeroPadded;
          totalNonPadded += previewStats.nonPadded;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not test All Requests report: ${error.message}`);
    }

    // Test 5: Check for roster period filters
    console.log('\n7️⃣  Testing Roster Period Filters...');
    await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Get all page text
    const pageText = await page.locator('body').textContent();
    const allMatches = pageText.match(/RP\d{1,2}\/\d{4}/g) || [];

    if (allMatches.length > 0) {
      console.log(`   Found ${allMatches.length} total roster period references`);
      const uniquePeriods = [...new Set(allMatches)].sort();

      console.log(`\n   Unique roster periods (${uniquePeriods.length}):`);
      uniquePeriods.forEach(period => {
        const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
        if (isZeroPadded) {
          console.log(`   ✅ ${period}`);
        } else {
          console.log(`   ❌ ${period} (NOT zero-padded)`);
        }
      });
    }

    // Final Summary
    console.log('\n\n📊 REPORTS TESTING SUMMARY');
    console.log('=' .repeat(80));
    console.log(`\n   Total Zero-Padded Roster Periods: ✅ ${totalZeroPadded}`);
    console.log(`   Total Non-Padded Roster Periods: ❌ ${totalNonPadded}`);

    if (totalNonPadded === 0 && totalZeroPadded > 0) {
      console.log('\n   🎉 SUCCESS! All roster periods in reports are correctly zero-padded (RP01/2026)');
    } else if (totalZeroPadded === 0 && totalNonPadded === 0) {
      console.log('\n   ⚠️  No roster periods found in reports');
      console.log('   Possible reasons:');
      console.log('   - No data in database');
      console.log('   - Roster periods in collapsed/hidden sections');
      console.log('   - Need to interact with filters first');
    } else {
      console.log('\n   ⚠️  WARNING! Some roster periods are not zero-padded');
    }

    console.log('\n📸 Screenshots saved:');
    console.log('   - reports-01-initial.png - Initial reports page');
    console.log('   - reports-02-rdo-sdo-selected.png - RDO/SDO report type');
    console.log('   - reports-03-rdo-sdo-preview.png - RDO/SDO preview');
    console.log('   - reports-04-leave-selected.png - Leave report type');
    console.log('   - reports-05-roster-periods-selected.png - Roster periods selected');
    console.log('   - reports-06-leave-preview.png - Leave preview');
    console.log('   - reports-07-all-requests-selected.png - All requests type');
    console.log('   - reports-08-all-requests-preview.png - All requests preview');

    console.log('\n✅ Reports testing complete!');
    console.log('   Chrome browser left open for manual inspection.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-screenshots/reports-error.png', fullPage: true });
  }
})();
