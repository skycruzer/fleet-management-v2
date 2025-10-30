#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function openPortal() {
  console.log('🚀 Opening Pilot Portal...\n');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();

  console.log('🌐 Loading portal at http://localhost:3000/portal/login\n');

  await page.goto('http://localhost:3000/portal/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  console.log('✅ Portal loaded! Browser will stay open for testing.\n');
  console.log('📋 Available portal pages:');
  console.log('   • /portal/login - Login page');
  console.log('   • /portal/register - Registration');
  console.log('   • /portal/dashboard - Dashboard (after login)');
  console.log('   • /portal/profile - Profile');
  console.log('   • /portal/leave-requests - Leave requests');
  console.log('   • /portal/flight-requests - Flight requests\n');
  console.log('Close the browser window when done.\n');
}

openPortal().catch(console.error);
