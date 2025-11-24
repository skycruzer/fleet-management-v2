#!/usr/bin/env node
/**
 * Detailed Page-by-Page Test
 * Author: Maurice Rondeau
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'skycruzer@icloud.com';
const PASSWORD = 'mron2393';

console.log('🧪 Detailed Page-by-Page Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const browser = await chromium.launch({ headless: false, slowMo: 1000 });
const context = await browser.newContext();
const page = await context.newPage();

// Listen to all console messages
page.on('console', msg => {
  const type = msg.type();
  if (type === 'error' || type === 'warning') {
    console.log(`   [Browser ${type.toUpperCase()}] ${msg.text()}`);
  }
});

// Listen to page errors
page.on('pageerror', error => {
  console.log(`   [PAGE ERROR] ${error.message}`);
});

async function login() {
  console.log('🔐 STEP 1: Logging in...\n');
  
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  console.log('   ✅ Login successful\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function testPage(name, url) {
  console.log(`📋 Testing: ${name}`);
  console.log(`   URL: ${url}\n`);
  
  try {
    // Navigate to page
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    // Check HTTP status
    const status = response.status();
    console.log(`   HTTP Status: ${status}`);
    
    if (status === 404) {
      console.log(`   ❌ 404 Not Found - Page does not exist!\n`);
      return false;
    }
    
    if (status >= 400) {
      console.log(`   ❌ HTTP Error: ${status}\n`);
      return false;
    }
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000);
    
    // Check current URL (might have redirected)
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if redirected to login (auth failed)
    if (currentUrl.includes('/auth/login')) {
      console.log(`   ❌ Redirected to login - authentication failed\n`);
      return false;
    }
    
    // Check for error messages
    const errorText = await page.locator('text=/error|not found|unauthorized|forbidden/i').first().textContent().catch(() => null);
    if (errorText) {
      console.log(`   ⚠️  Error message found: ${errorText}`);
    }
    
    // Get page title
    const title = await page.title();
    console.log(`   Page Title: ${title}`);
    
    // Take screenshot
    const screenshotName = name.toLowerCase().replace(/\s+/g, '-');
    await page.screenshot({ path: `screenshots/${screenshotName}.png`, fullPage: true });
    console.log(`   📸 Screenshot: screenshots/${screenshotName}.png`);
    
    // Check if page has content
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText.trim().length > 100;
    
    if (!hasContent) {
      console.log(`   ⚠️  Page appears empty (less than 100 chars)\n`);
      return false;
    }
    
    console.log(`   ✅ Page loaded successfully\n`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  try {
    await login();
    
    console.log('📊 STEP 2: Testing Each Page...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const pages = [
      { name: 'Dashboard Home', url: `${BASE_URL}/dashboard` },
      { name: 'Pilots List', url: `${BASE_URL}/dashboard/pilots` },
      { name: 'Certifications', url: `${BASE_URL}/dashboard/certifications` },
      { name: 'Leave Requests', url: `${BASE_URL}/dashboard/leave-requests` },
      { name: 'Flight Requests', url: `${BASE_URL}/dashboard/flight-requests` },
      { name: 'Analytics', url: `${BASE_URL}/dashboard/analytics` },
      { name: 'Settings', url: `${BASE_URL}/dashboard/settings` },
    ];
    
    const results = [];
    
    for (const pageInfo of pages) {
      const success = await testPage(pageInfo.name, pageInfo.url);
      results.push({ name: pageInfo.name, url: pageInfo.url, success });
      
      // Wait between pages
      await page.waitForTimeout(1000);
    }
    
    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (!result.success) {
        console.log(`   URL: ${result.url}`);
      }
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📈 Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed === 0) {
      console.log('🎉 All pages working!\n');
    } else {
      console.log('⚠️  Some pages have issues. Check details above.\n');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    console.log('⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🔚 Browser closed\n');
  }
}

runTests();
