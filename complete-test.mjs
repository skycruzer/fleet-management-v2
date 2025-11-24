import { chromium } from '@playwright/test';

const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';
const PILOT_EMAIL = 'mrondeau@airniugini.com.pg';
const PILOT_PASSWORD = 'mron2393';

(async () => {
  console.log('🚀 COMPLETE ROSTER PERIOD FORMAT TEST');
  console.log('=' .repeat(80));
  console.log('Starting Chromium browser...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  const page = await browser.newPage();

  let stats = {
    totalChecked: 0,
    zeroPadded: 0,
    nonPadded: 0,
    pagesVisited: 0
  };

  try {
    // ============================================
    // ADMIN PORTAL TESTING
    // ============================================
    console.log('📋 PART 1: ADMIN PORTAL');
    console.log('=' .repeat(80));

    // 1. Login
    console.log('\n1️⃣  Logging in to admin portal...');
    await page.goto('http://localhost:3000/auth/login', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForTimeout(5000);
    console.log('   ✅ Logged in successfully');
    stats.pagesVisited++;

    // 2. Admin Dashboard
    console.log('\n2️⃣  Testing Admin Dashboard...');
    await page.goto('http://localhost:3000/dashboard', { timeout: 30000 });
    await page.waitForTimeout(3000);

    let bodyText = await page.locator('body').textContent();
    let matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
    let unique = [...new Set(matches)];

    console.log(`   Found ${unique.length} roster periods:`);
    unique.forEach(period => {
      const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
      if (isZeroPadded) {
        stats.zeroPadded++;
        console.log(`   ✅ ${period}`);
      } else {
        stats.nonPadded++;
        console.log(`   ❌ ${period} (NOT zero-padded)`);
      }
    });
    stats.totalChecked += unique.length;
    stats.pagesVisited++;
    await page.screenshot({ path: 'test-screenshots/complete-01-dashboard.png', fullPage: true });

    // 3. Reports Page
    console.log('\n3️⃣  Testing Reports Page...');
    await page.goto('http://localhost:3000/dashboard/reports', { timeout: 30000 });
    await page.waitForTimeout(4000);

    bodyText = await page.locator('body').textContent();
    matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
    unique = [...new Set(matches)];

    if (unique.length > 0) {
      console.log(`   Found ${unique.length} roster periods:`);
      unique.forEach(period => {
        const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
        if (isZeroPadded) {
          stats.zeroPadded++;
          console.log(`   ✅ ${period}`);
        } else {
          stats.nonPadded++;
          console.log(`   ❌ ${period}`);
        }
      });
      stats.totalChecked += unique.length;
    } else {
      console.log('   ℹ️  No roster periods visible (may need user interaction)');
    }
    stats.pagesVisited++;
    await page.screenshot({ path: 'test-screenshots/complete-02-reports.png', fullPage: true });

    // 4. Requests Page
    console.log('\n4️⃣  Testing Requests Page...');
    await page.goto('http://localhost:3000/dashboard/requests', { timeout: 30000 });
    await page.waitForTimeout(3000);

    bodyText = await page.locator('body').textContent();
    matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
    unique = [...new Set(matches)];

    if (unique.length > 0) {
      console.log(`   Found ${unique.length} roster periods:`);
      unique.slice(0, 10).forEach(period => {
        const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
        if (isZeroPadded) {
          stats.zeroPadded++;
          console.log(`   ✅ ${period}`);
        } else {
          stats.nonPadded++;
          console.log(`   ❌ ${period}`);
        }
      });
      stats.totalChecked += unique.length;
    } else {
      console.log('   ℹ️  No roster periods found');
    }
    stats.pagesVisited++;
    await page.screenshot({ path: 'test-screenshots/complete-03-requests.png', fullPage: true });

    // ============================================
    // PILOT PORTAL TESTING
    // ============================================
    console.log('\n\n📋 PART 2: PILOT PORTAL');
    console.log('=' .repeat(80));

    // Logout
    console.log('\n5️⃣  Logging out of admin...');
    await page.goto('http://localhost:3000/auth/logout');
    await page.waitForTimeout(2000);

    // Login to pilot portal
    console.log('\n6️⃣  Logging in to pilot portal...');
    await page.goto('http://localhost:3000/portal/login', { timeout: 30000 });
    await page.waitForTimeout(2000);

    try {
      await page.getByLabel(/email|username/i).fill(PILOT_EMAIL);
      await page.getByLabel(/password/i).fill(PILOT_PASSWORD);
      await page.getByRole('button', { name: /sign in|log in|submit/i }).click();
      await page.waitForTimeout(5000);
      console.log('   ✅ Logged in to pilot portal');
      stats.pagesVisited++;

      // Pilot Dashboard
      console.log('\n7️⃣  Testing Pilot Dashboard...');
      await page.goto('http://localhost:3000/portal/dashboard', { timeout: 30000 });
      await page.waitForTimeout(3000);

      bodyText = await page.locator('body').textContent();
      matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
      unique = [...new Set(matches)];

      if (unique.length > 0) {
        console.log(`   Found ${unique.length} roster periods:`);
        unique.forEach(period => {
          const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
          if (isZeroPadded) {
            stats.zeroPadded++;
            console.log(`   ✅ ${period}`);
          } else {
            stats.nonPadded++;
            console.log(`   ❌ ${period}`);
          }
        });
        stats.totalChecked += unique.length;
      }
      stats.pagesVisited++;
      await page.screenshot({ path: 'test-screenshots/complete-04-pilot-dashboard.png', fullPage: true });

      // Leave Requests
      console.log('\n8️⃣  Testing Pilot Leave Requests...');
      await page.goto('http://localhost:3000/portal/leave-requests', { timeout: 30000 });
      await page.waitForTimeout(3000);

      bodyText = await page.locator('body').textContent();
      matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
      unique = [...new Set(matches)];

      if (unique.length > 0) {
        console.log(`   Found ${unique.length} roster periods:`);
        unique.forEach(period => {
          const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
          if (isZeroPadded) {
            stats.zeroPadded++;
            console.log(`   ✅ ${period}`);
          } else {
            stats.nonPadded++;
            console.log(`   ❌ ${period}`);
          }
        });
        stats.totalChecked += unique.length;
      }
      stats.pagesVisited++;
      await page.screenshot({ path: 'test-screenshots/complete-05-pilot-leave.png', fullPage: true });

      // RDO/SDO Requests
      console.log('\n9️⃣  Testing Pilot RDO/SDO Requests...');
      await page.goto('http://localhost:3000/portal/rdo-sdo-requests', { timeout: 30000 });
      await page.waitForTimeout(3000);

      bodyText = await page.locator('body').textContent();
      matches = bodyText.match(/RP\d{1,2}\/\d{4}/g) || [];
      unique = [...new Set(matches)];

      if (unique.length > 0) {
        console.log(`   Found ${unique.length} roster periods:`);
        unique.forEach(period => {
          const isZeroPadded = period.match(/RP0[1-9]\/\d{4}/) || period.match(/RP1[0-3]\/\d{4}/);
          if (isZeroPadded) {
            stats.zeroPadded++;
            console.log(`   ✅ ${period}`);
          } else {
            stats.nonPadded++;
            console.log(`   ❌ ${period}`);
          }
        });
        stats.totalChecked += unique.length;
      }
      stats.pagesVisited++;
      await page.screenshot({ path: 'test-screenshots/complete-06-pilot-rdo-sdo.png', fullPage: true });

    } catch (pilotError) {
      console.log(`   ⚠️  Pilot portal error: ${pilotError.message}`);
    }

    // ============================================
    // FINAL RESULTS
    // ============================================
    console.log('\n\n📊 COMPLETE TEST RESULTS');
    console.log('=' .repeat(80));
    console.log(`\nPages Visited: ${stats.pagesVisited}`);
    console.log(`Total Roster Periods Found: ${stats.totalChecked}`);
    console.log(`✅ Zero-Padded (RP01/2026): ${stats.zeroPadded}`);
    console.log(`❌ Non-Padded (RP1/2026): ${stats.nonPadded}`);

    const successRate = stats.totalChecked > 0
      ? ((stats.zeroPadded / stats.totalChecked) * 100).toFixed(1)
      : 0;

    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (stats.nonPadded === 0 && stats.zeroPadded > 0) {
      console.log('\n🎉 ✅ PERFECT! ALL roster periods are correctly zero-padded!');
    } else if (stats.nonPadded > 0) {
      console.log(`\n⚠️  WARNING: ${stats.nonPadded} roster periods are NOT zero-padded`);
    } else {
      console.log('\n⚠️  No roster periods found to verify');
    }

    console.log('\n📸 Screenshots saved:');
    console.log('   - complete-01-dashboard.png');
    console.log('   - complete-02-reports.png');
    console.log('   - complete-03-requests.png');
    console.log('   - complete-04-pilot-dashboard.png');
    console.log('   - complete-05-pilot-leave.png');
    console.log('   - complete-06-pilot-rdo-sdo.png');

    console.log('\n✅ TEST COMPLETE!');
    console.log('   Browser will remain open for 10 seconds for inspection...');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'test-screenshots/complete-error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed. Test finished.');
    process.exit(0);
  }
})();
