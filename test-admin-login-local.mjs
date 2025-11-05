#!/usr/bin/env node
/**
 * Test admin login locally
 */

import { chromium } from 'playwright'

console.log('🧪 Testing Admin Login Locally\n')
console.log('URL: http://localhost:3000/auth/login')
console.log('Credentials: skycruzer@icloud.com / mron2393\n')
console.log('='.repeat(60) + '\n')

const browser = await chromium.launch({
  headless: false, // Show browser
  slowMo: 500 // Slow down actions
})

const context = await browser.newContext()
const page = await context.newPage()

// Listen for console messages
page.on('console', msg => {
  console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
})

// Listen for errors
page.on('pageerror', error => {
  console.error(`[Page Error] ${error.message}`)
})

try {
  console.log('Step 1: Navigate to login page...')
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  console.log('Step 2: Check if page loaded...')
  const pageContent = await page.content()

  if (pageContent.includes('Admin Login')) {
    console.log('✅ Login page loaded successfully')
  } else {
    console.log('❌ Login page did not load correctly')
    console.log('Page content preview:', pageContent.substring(0, 500))
  }

  console.log('\nStep 3: Fill in credentials...')

  // Wait for email input
  await page.waitForSelector('input[type="email"]', { timeout: 5000 })
  await page.fill('input[type="email"]', 'skycruzer@icloud.com')
  console.log('✅ Email filled')

  // Wait for password input
  await page.waitForSelector('input[type="password"]', { timeout: 5000 })
  await page.fill('input[type="password"]', 'mron2393')
  console.log('✅ Password filled')

  console.log('\nStep 4: Submit login form...')
  await page.click('button[type="submit"]')

  // Wait for either success (redirect) or error
  console.log('Waiting for result...\n')

  try {
    // Wait for navigation to dashboard or error message
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.waitForSelector('[role="alert"], .error', { timeout: 10000 })
    ])

    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ ✅ ✅ LOGIN SUCCESSFUL! ✅ ✅ ✅')
      console.log('Redirected to dashboard\n')

      // Take screenshot
      await page.screenshot({ path: 'screenshots/admin-login-success.png' })
      console.log('Screenshot saved: screenshots/admin-login-success.png')
    } else {
      const errorMessage = await page.textContent('[role="alert"], .error').catch(() => 'No error message found')
      console.log('\n❌ LOGIN FAILED')
      console.log('Error message:', errorMessage)

      // Take screenshot
      await page.screenshot({ path: 'screenshots/admin-login-error.png' })
      console.log('Screenshot saved: screenshots/admin-login-error.png')
    }
  } catch (error) {
    console.log('\n⚠️  Timeout waiting for result')
    console.log('Current URL:', page.url())

    // Check for any visible errors
    const bodyText = await page.textContent('body')
    console.log('Page content:', bodyText.substring(0, 500))

    // Take screenshot
    await page.screenshot({ path: 'screenshots/admin-login-timeout.png' })
    console.log('Screenshot saved: screenshots/admin-login-timeout.png')
  }

  // Keep browser open for 5 seconds
  console.log('\nKeeping browser open for inspection...')
  await page.waitForTimeout(5000)

} catch (error) {
  console.error('\n❌ Test failed:', error.message)
  console.error('Stack:', error.stack)

  // Take screenshot of error
  await page.screenshot({ path: 'screenshots/admin-login-test-error.png' }).catch(() => {})
} finally {
  await browser.close()
  console.log('\n' + '='.repeat(60))
  console.log('Test complete')
}
