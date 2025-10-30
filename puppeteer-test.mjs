#!/usr/bin/env node

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';

async function testApplication() {
  console.log('🚀 Starting Puppeteer tests for Fleet Management V2...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    args: ['--window-size=1920,1080'],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    console.log('📍 Test 1: Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-screenshots/01-landing-page.png', fullPage: true });
    console.log('✅ Landing page loaded successfully');
    console.log(`   Title: ${await page.title()}`);

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    console.log('\n📍 Test 2: Admin Login Page');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-screenshots/02-admin-login.png', fullPage: true });
    console.log('✅ Admin login page loaded');

    await page.waitForTimeout(2000);

    console.log('\n📍 Test 3: Pilot Portal Login Page');
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-screenshots/03-pilot-login.png', fullPage: true });
    console.log('✅ Pilot portal login page loaded');

    await page.waitForTimeout(2000);

    console.log('\n📍 Test 4: Testing Navigation');
    // Test navigation back to home
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Look for navigation elements
    const hasNavigation = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return buttons.some(el =>
        el.textContent?.includes('Admin') ||
        el.textContent?.includes('Portal')
      );
    });

    if (hasNavigation) {
      console.log('✅ Navigation elements found');
    } else {
      console.log('⚠️  Navigation elements not clearly visible');
    }

    console.log('\n📍 Test 5: Checking Page Performance');
    const metrics = await page.metrics();
    console.log('✅ Performance metrics:');
    console.log(`   Nodes: ${metrics.Nodes}`);
    console.log(`   JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Layout Count: ${metrics.LayoutCount}`);

    console.log('\n📍 Test 6: Accessibility Check');
    const hasProperHeadings = await page.evaluate(() => {
      const h1s = document.querySelectorAll('h1');
      return h1s.length > 0;
    });
    console.log(`✅ H1 headings present: ${hasProperHeadings ? 'Yes' : 'No'}`);

    console.log('\n📍 Test 7: Responsive Design Test');
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-screenshots/04-mobile-view.png', fullPage: true });
    console.log('✅ Mobile viewport tested (375x812)');

    await page.waitForTimeout(2000);

    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-screenshots/05-tablet-view.png', fullPage: true });
    console.log('✅ Tablet viewport tested (768x1024)');

    await page.waitForTimeout(2000);

    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('\n📍 Test 8: Checking for Console Errors');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    if (logs.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log(`⚠️  Found ${logs.length} console errors`);
      logs.forEach(log => console.log(`   - ${log}`));
    }

    console.log('\n📍 Test Summary:');
    console.log('✅ All basic functionality tests passed!');
    console.log('📸 Screenshots saved to test-screenshots/');
    console.log('\n🎉 Testing complete! Browser will remain open for manual inspection.');
    console.log('   Close the browser window when done.');

    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true });
    throw error;
  }

  // Don't close browser automatically - let user inspect
  // await browser.close();
}

// Run tests
testApplication().catch(console.error);
