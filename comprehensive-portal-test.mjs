import { chromium } from '@playwright/test';

// Updated credentials from user
const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';

const PILOT_EMAIL = 'mrondeau@airniugini.com.pg';
const PILOT_PASSWORD = 'mron2393';

async function checkRosterPeriods(page, pageName) {
  console.log(`\n🔍 Checking roster periods on: ${pageName}`);

  // Wait longer for content to load
  await page.waitForTimeout(5000);

  const bodyText = await page.locator('body').textContent();
  const rosterMatches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];

  if (rosterMatches.length > 0) {
    const uniquePeriods = [...new Set(rosterMatches)].sort();
    console.log(`   Found ${uniquePeriods.length} unique roster periods:`);

    let zeroPaddedCount = 0;
    let nonPaddedCount = 0;

    uniquePeriods.forEach(period => {
      const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
      const isNonPadded = period.match(/RP[1-9]\/\d{4}/) && !period.match(/RP0[1-9]\/\d{4}/);

      if (isZeroPadded) {
        zeroPaddedCount++;
        console.log(`   ✅ ${period}`);
      } else if (isNonPadded) {
        nonPaddedCount++;
        console.log(`   ❌ ${period} (NOT zero-padded)`);
      }
    });

    console.log(`   Summary: ${zeroPaddedCount} zero-padded, ${nonPaddedCount} non-padded`);
    return { zeroPaddedCount, nonPaddedCount, total: uniquePeriods.length };
  } else {
    console.log(`   No roster periods found`);
    return { zeroPaddedCount: 0, nonPaddedCount: 0, total: 0 };
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // Slow down execution by 500ms per action
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 COMPREHENSIVE PORTAL TESTING - Roster Period Format Verification');
  console.log('   (Running at reduced speed for better observation)');
  console.log('=' .repeat(80));

  let totalStats = {
    zeroPadded: 0,
    nonPadded: 0,
    pagesChecked: 0
  };

  try {
    // ========================================
    // PART 1: ADMIN PORTAL TESTING
    // ========================================
    console.log('\n📋 PART 1: ADMIN PORTAL TESTING');
    console.log('=' .repeat(80));

    // 1. Login to Admin Portal
    console.log('\n1️⃣  Logging in to Admin Portal...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Fill login form
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.waitForTimeout(1000);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForTimeout(5000);
    console.log('   ✅ Logged in to admin portal');
    await page.screenshot({ path: 'test-screenshots/01-admin-dashboard.png' });

    // 2. Test Admin Dashboard
    console.log('\n2️⃣  Testing Admin Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
    const dashStats = await checkRosterPeriods(page, 'Admin Dashboard');
    totalStats.zeroPadded += dashStats.zeroPaddedCount;
    totalStats.nonPadded += dashStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/02-admin-dashboard-full.png', fullPage: true });

    // 3. Test Reports Page
    console.log('\n3️⃣  Testing Reports Page (MOST IMPORTANT)...');
    await page.goto('http://localhost:3000/dashboard/reports', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);  // Extra wait for reports page
    const reportStats = await checkRosterPeriods(page, 'Reports Page');
    totalStats.zeroPadded += reportStats.zeroPaddedCount;
    totalStats.nonPadded += reportStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/03-reports-page.png', fullPage: true });

    // 4. Test Requests Page
    console.log('\n4️⃣  Testing Requests Page...');
    await page.goto('http://localhost:3000/dashboard/requests', { waitUntil: 'networkidle', timeout: 60000 });
    const requestsStats = await checkRosterPeriods(page, 'Requests Page');
    totalStats.zeroPadded += requestsStats.zeroPaddedCount;
    totalStats.nonPadded += requestsStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/04-requests-page.png', fullPage: true });

    // 5. Test Leave Calendar
    console.log('\n5️⃣  Testing Leave Calendar...');
    await page.goto('http://localhost:3000/dashboard/leave/calendar', { waitUntil: 'networkidle', timeout: 60000 });
    const calendarStats = await checkRosterPeriods(page, 'Leave Calendar');
    totalStats.zeroPadded += calendarStats.zeroPaddedCount;
    totalStats.nonPadded += calendarStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/05-leave-calendar.png', fullPage: true });

    // 6. Test Leave Bids Page
    console.log('\n6️⃣  Testing Leave Bids Page...');
    await page.goto('http://localhost:3000/dashboard/admin/leave-bids', { waitUntil: 'networkidle', timeout: 60000 });
    const leaveBidsStats = await checkRosterPeriods(page, 'Leave Bids Page');
    totalStats.zeroPadded += leaveBidsStats.zeroPaddedCount;
    totalStats.nonPadded += leaveBidsStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/06-leave-bids.png', fullPage: true });

    // 7. Test Certifications Page
    console.log('\n7️⃣  Testing Certifications Page...');
    await page.goto('http://localhost:3000/dashboard/certifications', { waitUntil: 'networkidle', timeout: 60000 });
    const certsStats = await checkRosterPeriods(page, 'Certifications Page');
    totalStats.zeroPadded += certsStats.zeroPaddedCount;
    totalStats.nonPadded += certsStats.nonPaddedCount;
    totalStats.pagesChecked++;
    await page.screenshot({ path: 'test-screenshots/07-certifications.png', fullPage: true });

    console.log('\n✅ Admin portal testing complete');

    // ========================================
    // PART 2: PILOT PORTAL TESTING
    // ========================================
    console.log('\n\n📋 PART 2: PILOT PORTAL TESTING');
    console.log('=' .repeat(80));

    // Logout from admin
    console.log('\n8️⃣  Logging out of admin portal...');
    await page.goto('http://localhost:3000/auth/logout');
    await page.waitForTimeout(3000);

    // Login to Pilot Portal
    console.log('\n9️⃣  Logging in to Pilot Portal...');
    console.log(`   Email: ${PILOT_EMAIL}`);
    await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    try {
      // Try pilot login
      await page.getByLabel(/email|username/i).fill(PILOT_EMAIL);
      await page.waitForTimeout(1000);
      await page.getByLabel(/password/i).fill(PILOT_PASSWORD);
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /sign in|log in|submit/i }).click();
      await page.waitForTimeout(5000);

      console.log('   ✅ Logged in to pilot portal');

      // Test Pilot Dashboard
      console.log('\n🔟 Testing Pilot Dashboard...');
      await page.goto('http://localhost:3000/portal/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
      const pilotDashStats = await checkRosterPeriods(page, 'Pilot Dashboard');
      totalStats.zeroPadded += pilotDashStats.zeroPaddedCount;
      totalStats.nonPadded += pilotDashStats.nonPaddedCount;
      totalStats.pagesChecked++;
      await page.screenshot({ path: 'test-screenshots/08-pilot-dashboard.png', fullPage: true });

      // Test Pilot Leave Requests
      console.log('\n1️⃣1️⃣  Testing Pilot Leave Requests Page...');
      await page.goto('http://localhost:3000/portal/leave-requests', { waitUntil: 'networkidle', timeout: 60000 });
      const pilotLeaveStats = await checkRosterPeriods(page, 'Pilot Leave Requests');
      totalStats.zeroPadded += pilotLeaveStats.zeroPaddedCount;
      totalStats.nonPadded += pilotLeaveStats.nonPaddedCount;
      totalStats.pagesChecked++;
      await page.screenshot({ path: 'test-screenshots/09-pilot-leave-requests.png', fullPage: true });

      // Test Pilot RDO/SDO Requests
      console.log('\n1️⃣2️⃣  Testing Pilot RDO/SDO Requests Page...');
      await page.goto('http://localhost:3000/portal/rdo-sdo-requests', { waitUntil: 'networkidle', timeout: 60000 });
      const pilotRdoStats = await checkRosterPeriods(page, 'Pilot RDO/SDO Requests');
      totalStats.zeroPadded += pilotRdoStats.zeroPaddedCount;
      totalStats.nonPadded += pilotRdoStats.nonPaddedCount;
      totalStats.pagesChecked++;
      await page.screenshot({ path: 'test-screenshots/10-pilot-rdo-sdo.png', fullPage: true });

      console.log('\n✅ Pilot portal testing complete');

    } catch (pilotError) {
      console.log(`   ⚠️  Could not test pilot portal: ${pilotError.message}`);
      await page.screenshot({ path: 'test-screenshots/pilot-error.png' });
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n\n📊 FINAL TEST SUMMARY');
    console.log('=' .repeat(80));
    console.log(`\n   Pages Checked: ${totalStats.pagesChecked}`);
    console.log(`   ✅ Zero-Padded Roster Periods: ${totalStats.zeroPadded}`);
    console.log(`   ❌ Non-Padded Roster Periods: ${totalStats.nonPadded}`);

    if (totalStats.nonPadded === 0 && totalStats.zeroPadded > 0) {
      console.log('\n   🎉 SUCCESS! All roster periods are correctly zero-padded (RP01/2026 format)');
    } else if (totalStats.zeroPadded === 0 && totalStats.nonPadded === 0) {
      console.log('\n   ⚠️  No roster periods were found on any page');
      console.log('   This might indicate:');
      console.log('   - Pages are still loading (try increasing wait times)');
      console.log('   - No data exists in the database');
      console.log('   - Roster periods are in hidden/collapsed sections');
    } else {
      console.log('\n   ⚠️  WARNING! Some roster periods are not zero-padded');
      console.log(`   ${totalStats.nonPadded} locations need fixing`);
    }

    console.log('\n📸 Screenshots saved in test-screenshots/');
    console.log('   Check the screenshots to verify roster period format visually');

    console.log('\n✅ Comprehensive testing complete!');
    console.log('   Chrome browser left open for manual inspection.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-screenshots/error.png' });
  }
})();
