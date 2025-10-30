/**
 * Simple test - just try to change rank manually like a human would
 */

const puppeteer = require('puppeteer');

const ADMIN_EMAIL = 'skycruzer@icloud.com';
const ADMIN_PASSWORD = 'mron2393';
const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testManualRankClick() {
  console.log('🧪 Testing MANUAL rank change (like a human)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500, // Very slow so we can see what's happening
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  try {
    // Login
    console.log('📝 Logging in...');
    await page.goto(`${BASE_URL}/auth/login`);
    await page.type('#email', ADMIN_EMAIL);
    await page.type('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Logged in\n');

    // Go to pilots list
    console.log('📝 Going to pilots list...');
    await page.goto(`${BASE_URL}/dashboard/pilots`);
    await wait(1000);
    console.log('✅ Pilots list loaded\n');

    // Click first edit button
    console.log('📝 Clicking first edit button...');
    const editLink = await page.$('a[href*="/dashboard/pilots/"][href*="/edit"]');
    const href = await page.evaluate(el => el.getAttribute('href'), editLink);
    const pilotId = href.split('/')[3];
    console.log(`✅ Found pilot: ${pilotId}\n`);

    await editLink.click();
    await page.waitForNavigation();
    await wait(2000);
    console.log('✅ Edit page loaded\n');

    // Get current rank
    const currentRank = await page.$eval('#role', el => el.value);
    console.log(`📊 Current rank: ${currentRank}`);

    const newRank = currentRank === 'Captain' ? 'First Officer' : 'Captain';
    console.log(`📝 Will change to: ${newRank}\n`);

    // Click on the dropdown (THIS IS THE KEY TEST!)
    console.log('📝 Clicking on dropdown...');
    await page.click('#role');
    await wait(500);

    // Click on the option
    console.log('📝 Clicking on option...');
    await page.select('#role', newRank);
    await wait(1000);

    // Check if value changed
    const afterClick = await page.$eval('#role', el => el.value);
    console.log(`\n📊 After click: ${afterClick}`);

    if (afterClick === newRank) {
      console.log('✅ SUCCESS: Dropdown changed!');
    } else {
      console.log(`❌ FAIL: Dropdown didn't change (still ${afterClick})`);
    }

    console.log('\n🎬 Keeping browser open for 30 seconds so you can inspect...');
    await wait(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
}

testManualRankClick();
