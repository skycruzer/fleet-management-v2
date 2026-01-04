#!/usr/bin/env node
/**
 * Final test of admin login after RLS fix
 */

import { chromium } from 'playwright'

console.log('🧪 Testing Admin Login (Final Test)\n')
console.log('Testing with RLS fix applied to an_users table\n')
console.log('='.repeat(60) + '\n')

const browser = await chromium.launch({
  headless: false,
  slowMo: 500,
})

const context = await browser.newContext()
const page = await context.newPage()

// Listen for console messages
page.on('console', (msg) => {
  if (msg.text().includes('Login') || msg.text().includes('Dashboard')) {
    console.log(`[Browser] ${msg.text()}`)
  }
})

try {
  console.log('Step 1: Navigate to login page...')
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })
  console.log('✅ Login page loaded\n')

  console.log('Step 2: Fill credentials...')
  await page.fill('input[type="email"]', 'skycruzer@icloud.com')
  await page.fill('input[type="password"]', 'mron2393')
  console.log('✅ Credentials entered\n')

  console.log('Step 3: Submit login...')
  await page.click('button[type="submit"]')

  // Wait for navigation
  await page.waitForTimeout(3000)

  const currentUrl = page.url()
  console.log(`Current URL: ${currentUrl}\n`)

  if (currentUrl.includes('/dashboard') && !currentUrl.includes('error')) {
    console.log('✅ ✅ ✅ SUCCESS! ✅ ✅ ✅')
    console.log('Admin login working correctly!')
    console.log('Redirected to dashboard\n')

    // Take success screenshot
    await page.screenshot({ path: 'screenshots/admin-login-success.png' })
    console.log('Screenshot: screenshots/admin-login-success.png')

    // Check if dashboard content loaded
    const dashboardText = await page.textContent('body')
    if (dashboardText.includes('Dashboard') || dashboardText.includes('Pilots')) {
      console.log('✅ Dashboard content loaded')
    }
  } else if (currentUrl.includes('error') || currentUrl.includes('/auth/login')) {
    console.log('❌ LOGIN FAILED')
    console.log('Still on login page or error page\n')

    // Check for error message
    const pageText = await page.textContent('body')
    console.log('Page contains:', pageText.substring(0, 200))

    await page.screenshot({ path: 'screenshots/admin-login-failed.png' })
    console.log('Screenshot: screenshots/admin-login-failed.png')
  }

  console.log('\nKeeping browser open for 10 seconds...')
  await page.waitForTimeout(10000)
} catch (error) {
  console.error('❌ Test error:', error.message)
  await page.screenshot({ path: 'screenshots/admin-login-error.png' })
} finally {
  await browser.close()
  console.log('\n' + '='.repeat(60))
  console.log('Test complete')
}
