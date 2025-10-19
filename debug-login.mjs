#!/usr/bin/env node
import { chromium } from 'playwright';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  try {
    console.log('🔍 Opening login page...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📝 Filling credentials...');
    await page.fill('input[type="email"]', 'skycruzer@icloud.com');
    await page.fill('input[type="password"]', 'mron2393');
    
    console.log('🔐 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait and check for error or success
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check for error message
    const errorMsg = await page.$('.text-red-600');
    if (errorMsg) {
      const text = await errorMsg.textContent();
      console.log('❌ Error message:', text);
    } else {
      console.log('ℹ️  No error message displayed');
    }
    
    // Check if "Signing in..." button appears
    const buttonText = await page.$('button[type="submit"]');
    if (buttonText) {
      const text = await buttonText.textContent();
      console.log('🔘 Button text:', text);
    }
    
    console.log('\n⏸️  Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugLogin();
