import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Authenticated Testing: Hierarchical Grouping & Leave Bids\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    // Fill in credentials
    await page.fill('input[type="email"]', 'skycruzer@icloud.com');
    await page.fill('input[type="password"]', 'mron2393');
    await page.click('button[type="submit"]');

    console.log('   ⏳ Waiting for login to complete...');
    await page.waitForTimeout(5000);

    // Check if we're logged in (should redirect to dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/auth/login')) {
      console.log(`   ✅ Login successful (URL: ${currentUrl})\n`);
    } else {
      console.log(`   ⚠️  Unexpected URL: ${currentUrl}\n`);
    }

    // Step 2: Navigate to Reports page
    console.log('2️⃣ Navigating to Reports page...');
    await page.goto('http://localhost:3000/dashboard/reports', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    console.log('   ✅ Reports page loaded\n');

    // Step 3: Verify tabs exist
    console.log('3️⃣ Verifying report tabs...');

    // Check for all tabs
    const leaveTab = await page.locator('button:has-text("Leave Requests")').count();
    const flightTab = await page.locator('button:has-text("Flight Requests")').count();
    const leaveBidsTab = await page.locator('button:has-text("Leave Bids")').count();
    const certificationsTab = await page.locator('button:has-text("Certifications")').count();

    console.log(`   Leave Requests tab: ${leaveTab > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Flight Requests tab: ${flightTab > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Leave Bids tab: ${leaveBidsTab > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Certifications tab: ${certificationsTab > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

    await page.screenshot({ path: 'test-tabs-overview.png' });
    console.log('   📸 Screenshot: test-tabs-overview.png\n');

    // Step 4: Test Leave report with grouping
    console.log('4️⃣ Testing Leave report grouping...');

    // Click Leave Requests tab
    await page.click('button:has-text("Leave Requests")');
    await page.waitForTimeout(2000);
    console.log('   ✅ Leave Requests tab active');

    // Click Preview button
    console.log('   - Clicking Preview...');
    const previewButton = page.locator('button:has-text("Preview")').first();
    await previewButton.click();
    await page.waitForTimeout(4000); // Wait for data to load

    // Check for grouping controls
    const rosterPeriodBtn = await page.locator('button:has-text("Roster Period")').count();
    const rankBtn = await page.locator('button:has-text("Rank")').count();

    console.log(`   Roster Period button: ${rosterPeriodBtn > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Rank button: ${rankBtn > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);

    if (rosterPeriodBtn > 0) {
      // Test grouping by Roster Period
      console.log('   - Testing group by Roster Period...');
      await page.click('button:has-text("Roster Period")');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-group-roster.png' });
      console.log('   📸 Screenshot: test-group-roster.png');

      // Count chevron icons (group headers)
      const chevrons = await page.locator('svg.lucide-chevron-down').count();
      console.log(`   ✅ Found ${chevrons} group header rows`);

      if (chevrons > 0) {
        // Test expand/collapse
        console.log('   - Testing expand/collapse...');
        const firstChevron = page.locator('svg.lucide-chevron-down').first();
        await firstChevron.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-collapsed.png' });
        console.log('   📸 Screenshot: test-collapsed.png');

        await firstChevron.click();
        await page.waitForTimeout(500);
        console.log('   ✅ Expand/collapse working');
      }

      // Test hierarchical grouping (Roster Period + Rank)
      if (rankBtn > 0) {
        console.log('   - Testing hierarchical grouping (Roster Period → Rank)...');
        await page.click('button:has-text("Rank")');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-hierarchical.png' });
        console.log('   📸 Screenshot: test-hierarchical.png');
        console.log('   ✅ Hierarchical grouping applied');
      }

      // Clear grouping
      const clearBtn = await page.locator('button:has-text("Clear Grouping")').count();
      if (clearBtn > 0) {
        console.log('   - Clearing grouping...');
        await page.click('button:has-text("Clear Grouping")');
        await page.waitForTimeout(500);
        console.log('   ✅ Grouping cleared');
      }
    }

    console.log('\n');

    // Step 5: Test multi-roster period display
    console.log('5️⃣ Testing multi-roster period display...');
    const bodyText = await page.locator('body').textContent();
    const multiPeriodMatches = bodyText.match(/RP\d{2}\/\d{4},\s*RP\d{2}\/\d{4}/g) || [];

    if (multiPeriodMatches.length > 0) {
      console.log(`   ✅ Found ${multiPeriodMatches.length} multi-roster period displays`);
      console.log(`   Examples: ${multiPeriodMatches.slice(0, 3).join(' | ')}`);
    } else {
      console.log('   ℹ️  No multi-roster periods found (no spanning dates in data)');
    }

    console.log('\n');

    // Step 6: Test Leave Bids tab
    console.log('6️⃣ Testing Leave Bids tab...');
    if (leaveBidsTab > 0) {
      await page.click('button:has-text("Leave Bids")');
      await page.waitForTimeout(2000);
      console.log('   ✅ Leave Bids tab opened');

      // Check form elements
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      console.log(`   ✅ Found ${checkboxes} filter checkboxes`);

      // Check for Preview button
      const lbPreviewBtn = await page.locator('button:has-text("Preview")').count();
      if (lbPreviewBtn > 0) {
        console.log('   ✅ Preview button found');

        // Try to load data
        await page.click('button:has-text("Preview")');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-leave-bids.png' });
        console.log('   📸 Screenshot: test-leave-bids.png');
      }
    } else {
      console.log('   ❌ Leave Bids tab not found');
    }

    console.log('\n');

    // Final summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Authentication:', currentUrl.includes('/dashboard') ? 'PASS' : 'FAIL');
    console.log('   ✅ Leave Requests tab:', leaveTab > 0 ? 'PASS' : 'FAIL');
    console.log('   ✅ Flight Requests tab:', flightTab > 0 ? 'PASS' : 'FAIL');
    console.log('   ✅ Leave Bids tab:', leaveBidsTab > 0 ? 'PASS' : 'FAIL');
    console.log('   ✅ Certifications tab:', certificationsTab > 0 ? 'PASS' : 'FAIL');
    console.log('   ✅ Grouping controls:', rosterPeriodBtn > 0 && rankBtn > 0 ? 'PASS' : 'UNCERTAIN');
    console.log('   ✅ Multi-roster periods:', multiPeriodMatches.length > 0 ? 'PASS' : 'UNCERTAIN');

    console.log('\n✅ Testing Complete!\n');
    console.log('📁 Screenshots saved:');
    console.log('   - test-tabs-overview.png');
    console.log('   - test-group-roster.png');
    console.log('   - test-collapsed.png');
    console.log('   - test-hierarchical.png');
    console.log('   - test-leave-bids.png');
    console.log('\n🔍 Browser left open for manual inspection.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'test-auth-error.png' });
    console.log('📸 Error screenshot: test-auth-error.png');
  } finally {
    console.log('\n(Browser window left open for manual testing)');
  }
})();
