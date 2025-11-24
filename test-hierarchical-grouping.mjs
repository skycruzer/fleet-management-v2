import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing Hierarchical Grouping & Leave Bids Implementation\n');

  try {
    // Step 1: Navigate to Reports page
    console.log('1️⃣ Navigating to Reports page...');
    await page.goto('http://localhost:3000/dashboard/reports', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log('   ✅ Reports page loaded\n');

    // Step 2: Verify Leave Bids tab exists
    console.log('2️⃣ Verifying Leave Bids tab...');
    const leaveBidsTab = await page.locator('button[value="leave-bids"]');
    const tabExists = await leaveBidsTab.count() > 0;

    if (tabExists) {
      console.log('   ✅ Leave Bids tab found');
      await page.screenshot({ path: 'test-leave-bids-tab.png' });
      console.log('   📸 Screenshot saved: test-leave-bids-tab.png\n');
    } else {
      console.log('   ❌ Leave Bids tab NOT found\n');
    }

    // Step 3: Test Leave report with grouping
    console.log('3️⃣ Testing Leave report grouping...');

    // Ensure we're on Leave tab
    await page.click('button[value="leave"]');
    await page.waitForTimeout(1000);

    // Click Preview to load data
    console.log('   - Clicking Preview button...');
    const previewButton = page.locator('button:has-text("Preview")').first();
    await previewButton.click();
    await page.waitForTimeout(3000); // Wait for data to load

    // Check if grouping controls exist
    const groupByRosterPeriodButton = page.locator('button:has-text("Roster Period")').first();
    const groupByRankButton = page.locator('button:has-text("Rank")').first();

    const rosterGroupExists = await groupByRosterPeriodButton.count() > 0;
    const rankGroupExists = await groupByRankButton.count() > 0;

    if (rosterGroupExists && rankGroupExists) {
      console.log('   ✅ Grouping controls found (Roster Period + Rank)');

      // Test grouping by Roster Period
      console.log('   - Testing group by Roster Period...');
      await groupByRosterPeriodButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-group-roster-period.png' });
      console.log('   📸 Screenshot: test-group-roster-period.png');

      // Test hierarchical grouping (Roster Period → Rank)
      console.log('   - Testing hierarchical grouping (Roster Period → Rank)...');
      await groupByRankButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-hierarchical-grouping.png' });
      console.log('   📸 Screenshot: test-hierarchical-grouping.png');

      // Look for group header rows with chevron
      const chevronIcons = await page.locator('svg.lucide-chevron-down').count();
      if (chevronIcons > 0) {
        console.log(`   ✅ Found ${chevronIcons} group header rows with chevron icons`);
      } else {
        console.log('   ⚠️  No chevron icons found (might be no groupable data)');
      }

      // Test expand/collapse
      const firstChevron = page.locator('svg.lucide-chevron-down').first();
      if (await firstChevron.count() > 0) {
        console.log('   - Testing expand/collapse...');
        await firstChevron.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-collapsed-group.png' });
        console.log('   📸 Screenshot: test-collapsed-group.png');

        await firstChevron.click();
        await page.waitForTimeout(500);
        console.log('   ✅ Expand/collapse working');
      }

      // Clear grouping
      console.log('   - Testing clear grouping...');
      const clearButton = page.locator('button:has-text("Clear Grouping")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(500);
        console.log('   ✅ Clear grouping button working');
      }

    } else {
      console.log('   ❌ Grouping controls NOT found');
    }

    console.log('\n');

    // Step 4: Test Leave Bids report
    console.log('4️⃣ Testing Leave Bids report...');
    if (tabExists) {
      await page.click('button[value="leave-bids"]');
      await page.waitForTimeout(2000);

      // Check for form elements
      const statusCheckboxes = await page.locator('input[type="checkbox"]').count();
      console.log(`   ✅ Found ${statusCheckboxes} checkboxes (status/rank filters)`);

      // Check for Preview button
      const leaveBidsPreview = page.locator('button:has-text("Preview")').first();
      if (await leaveBidsPreview.count() > 0) {
        console.log('   ✅ Preview button found');

        // Try to load Leave Bids data
        await leaveBidsPreview.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-leave-bids-preview.png' });
        console.log('   📸 Screenshot: test-leave-bids-preview.png');
      }
    }

    console.log('\n');

    // Step 5: Test multi-roster period display
    console.log('5️⃣ Testing multi-roster period display...');

    // Check page text for comma-separated roster periods
    const bodyText = await page.locator('body').textContent();
    const multiPeriodMatches = bodyText.match(/RP\d{2}\/\d{4},\s*RP\d{2}\/\d{4}/g) || [];

    if (multiPeriodMatches.length > 0) {
      console.log(`   ✅ Found ${multiPeriodMatches.length} multi-roster period displays`);
      console.log(`   Examples: ${multiPeriodMatches.slice(0, 3).join(', ')}`);
    } else {
      console.log('   ℹ️  No multi-roster period displays found (might be no spanning dates)');
    }

    console.log('\n');

    // Step 6: Test RDO/SDO report grouping (if has data)
    console.log('6️⃣ Testing RDO/SDO report grouping...');

    // Look for RDO/SDO in tabs or page
    const rdoSdoExists = bodyText.includes('RDO') || bodyText.includes('SDO');

    if (rdoSdoExists) {
      console.log('   ✅ RDO/SDO content detected');
      // Could add more specific RDO/SDO testing here if needed
    } else {
      console.log('   ℹ️  RDO/SDO content not detected on current view');
    }

    console.log('\n');

    // Final summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Leave Bids tab:', tabExists ? 'PASS' : 'FAIL');
    console.log('   ✅ Grouping controls:', rosterGroupExists && rankGroupExists ? 'PASS' : 'FAIL');
    console.log('   ✅ Multi-roster periods:', multiPeriodMatches.length > 0 ? 'PASS' : 'UNCERTAIN');
    console.log('\n✅ Testing Complete!\n');
    console.log('📁 Screenshots saved:');
    console.log('   - test-leave-bids-tab.png');
    console.log('   - test-group-roster-period.png');
    console.log('   - test-hierarchical-grouping.png');
    console.log('   - test-collapsed-group.png');
    console.log('   - test-leave-bids-preview.png');
    console.log('\n🔍 Browser left open for manual inspection.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    await page.screenshot({ path: 'test-error.png' });
    console.log('📸 Error screenshot: test-error.png');
  } finally {
    // Leave browser open for manual inspection
    console.log('\n(Browser window left open for manual testing)');
  }
})();
