#!/usr/bin/env node
/**
 * Real Browser Login Test
 * Opens actual browser and tests login flow
 *
 * Author: Maurice Rondeau
 */

import { chromium } from 'playwright';

const EMAIL = 'skycruzer@icloud.com';
const PASSWORD = 'mron2393';
const APP_URL = 'http://localhost:3000';

console.log('🌐 Real Browser Login Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testBrowserLogin() {
  let browser;
  let context;
  let page;

  try {
    console.log('🚀 Launching Chrome browser...\n');

    browser = await chromium.launch({
      headless: false, // Show browser
      slowMo: 500, // Slow down actions for visibility
    });

    context = await browser.newContext();
    page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      console.log(`   [Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...\n');
    await page.goto(`${APP_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Login page loaded\n');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/01-login-page.png' });
    console.log('   📸 Screenshot saved: screenshots/01-login-page.png\n');

    // Step 2: Fill in credentials
    console.log('📝 Step 2: Filling in credentials...\n');

    await page.fill('input[type="email"]', EMAIL);
    console.log(`   ✅ Email entered: ${EMAIL}`);

    await page.fill('input[type="password"]', PASSWORD);
    console.log(`   ✅ Password entered: ${'*'.repeat(PASSWORD.length)}\n`);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/02-credentials-entered.png' });
    console.log('   📸 Screenshot saved: screenshots/02-credentials-entered.png\n');

    // Step 3: Submit form
    console.log('🔐 Step 3: Submitting login form...\n');

    await page.click('button[type="submit"]');
    console.log('   ⏳ Waiting for response...\n');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   📍 Current URL: ${currentUrl}\n`);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/03-after-submit.png' });
    console.log('   📸 Screenshot saved: screenshots/03-after-submit.png\n');

    // Step 4: Check result
    console.log('📊 Step 4: Checking login result...\n');

    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ SUCCESS! Redirected to dashboard');
      console.log('   ✅ Login is working correctly!\n');

      // Check dashboard content
      const pageContent = await page.content();
      if (pageContent.includes('Pilots') || pageContent.includes('Dashboard')) {
        console.log('   ✅ Dashboard content loaded\n');
      }

      // Take final screenshot
      await page.screenshot({ path: 'screenshots/04-dashboard.png' });
      console.log('   📸 Screenshot saved: screenshots/04-dashboard.png\n');

    } else if (currentUrl.includes('/auth/login')) {
      console.log('   ❌ Still on login page - login failed\n');

      // Check for error messages
      const errorElement = await page.$('[role="alert"]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log(`   ⚠️  Error message: ${errorText}\n`);
      }

      // Check URL parameters
      const url = new URL(currentUrl);
      const error = url.searchParams.get('error');
      const message = url.searchParams.get('message');

      if (error || message) {
        console.log('   ⚠️  URL Error Parameters:');
        if (error) console.log(`      Error: ${error}`);
        if (message) console.log(`      Message: ${decodeURIComponent(message)}`);
        console.log('');
      }

    } else {
      console.log(`   ⚠️  Unexpected URL: ${currentUrl}\n`);
    }

    // Step 5: Check cookies
    console.log('🍪 Step 5: Checking session cookies...\n');

    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('auth-token'));

    if (authCookie) {
      console.log('   ✅ Auth cookie found:');
      console.log(`      Name: ${authCookie.name}`);
      console.log(`      Domain: ${authCookie.domain}`);
      console.log(`      Path: ${authCookie.path}`);
      console.log(`      Secure: ${authCookie.secure}`);
      console.log(`      HttpOnly: ${authCookie.httpOnly}`);
      console.log(`      Value length: ${authCookie.value.length} chars\n`);
    } else {
      console.log('   ❌ No auth cookie found\n');
      console.log('   Available cookies:');
      cookies.forEach(c => {
        console.log(`      - ${c.name}`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Browser Test Complete\n');

    console.log('📸 Screenshots saved in screenshots/ directory\n');

    // Keep browser open for 5 seconds
    console.log('⏸️  Keeping browser open for 5 seconds...\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('💥 Error during test:', error.message);
    console.error(error);

    // Take error screenshot
    if (page) {
      await page.screenshot({ path: 'screenshots/error.png' });
      console.log('   📸 Error screenshot saved: screenshots/error.png');
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed\n');
    }
  }
}

// Create screenshots directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('screenshots', { recursive: true });
} catch (err) {
  // Directory already exists
}

testBrowserLogin();
