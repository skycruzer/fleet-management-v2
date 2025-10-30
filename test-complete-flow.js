/**
 * COMPLETE END-TO-END TEST
 * Tests: Change rank → Submit → Verify persistence
 */

const puppeteer = require('puppeteer');

const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';
const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPLETE END-TO-END TEST: Rank Change + Submit + Verify');
  console.log('='.repeat(80) + '\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // Log console messages from the page
  page.on('console', msg => console.log('🌐 Browser Console:', msg.text()));

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    await page.goto(`${BASE_URL}/auth/login`);
    await page.type('#email', ADMIN_EMAIL);
    await page.type('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Logged in\n');

    // Step 2: Go to pilots list
    console.log('📝 Step 2: Going to pilots list...');
    await page.goto(`${BASE_URL}/dashboard/pilots`);
    await wait(1000);
    console.log('✅ Pilots list loaded\n');

    // Step 3: Click first edit button
    console.log('📝 Step 3: Opening first pilot edit page...');
    const editLink = await page.$('a[href*="/dashboard/pilots/"][href*="/edit"]');
    const href = await page.evaluate(el => el.getAttribute('href'), editLink);
    const pilotId = href.split('/')[3];
    console.log(`✅ Found pilot ID: ${pilotId}\n`);

    await editLink.click();
    await page.waitForNavigation();
    await wait(2000);
    console.log('✅ Edit page loaded\n');

    // Step 4: Get current rank
    console.log('📝 Step 4: Reading current rank...');
    const currentRank = await page.$eval('#role', el => el.value);
    console.log(`📊 Current rank: ${currentRank}`);

    const newRank = currentRank === 'Captain' ? 'First Officer' : 'Captain';
    console.log(`📝 Will change to: ${newRank}\n`);

    // Step 5: Change rank using page.select
    console.log('📝 Step 5: Changing rank...');
    await page.select('#role', newRank);
    await wait(1000);

    const afterChange = await page.$eval('#role', el => el.value);
    console.log(`✅ Dropdown now shows: ${afterChange}\n`);

    if (afterChange !== newRank) {
      console.error(`❌ FAIL: Dropdown didn't change properly`);
      await browser.close();
      return;
    }

    // Step 6: Submit form
    console.log('📝 Step 6: Clicking "Update Pilot" button...');
    console.log('⏰ WATCH SERVER LOGS NOW!\n');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const updateBtn = buttons.find(btn => btn.textContent.includes('Update Pilot'));
      if (updateBtn) {
        updateBtn.click();
      }
    });

    console.log('🔄 Button clicked, waiting for navigation...\n');

    // Wait for navigation or response
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Navigation completed\n');
    } catch (e) {
      console.log('⚠️  No navigation - may have stayed on same page\n');
    }

    await wait(3000);

    // Step 7: Navigate back to edit page to verify
    console.log('📝 Step 7: Going back to edit page to verify...');
    await page.goto(`${BASE_URL}/dashboard/pilots/${pilotId}/edit`);
    await wait(2000);

    const verifiedRank = await page.$eval('#role', el => el.value);
    console.log(`📊 Rank on edit page after save: ${verifiedRank}\n`);

    // Step 8: Check pilot detail page
    console.log('📝 Step 8: Checking pilot detail page...');
    await page.goto(`${BASE_URL}/dashboard/pilots/${pilotId}`);
    await wait(2000);

    const detailPageContent = await page.evaluate(() => document.body.textContent);
    let detailPageRank = 'Unknown';
    if (detailPageContent.includes(newRank)) {
      detailPageRank = newRank;
    } else if (detailPageContent.includes(currentRank)) {
      detailPageRank = currentRank;
    }

    console.log(`📊 Rank on detail page: ${detailPageRank}\n`);

    // Final Results
    console.log('='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Original Rank:           ${currentRank}`);
    console.log(`Intended New Rank:       ${newRank}`);
    console.log(`Rank After Submit:       ${verifiedRank}`);
    console.log(`Rank On Detail Page:     ${detailPageRank}`);
    console.log('='.repeat(80));

    if (verifiedRank === newRank && detailPageRank === newRank) {
      console.log('\n✅ SUCCESS: Rank update worked and persisted!');
      console.log('✅ The form is working correctly!\n');
    } else if (verifiedRank === currentRank) {
      console.log('\n❌ FAILURE: Rank did NOT change');
      console.log('❌ Form submission may not be sending the updated value\n');
    } else {
      console.log('\n⚠️  PARTIAL: Rank changed but may not have persisted correctly\n');
    }

    console.log('⏱️  Keeping browser open for 10 seconds for manual inspection...\n');
    await wait(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Browser closed\n');
  }
}

testCompleteFlow();
