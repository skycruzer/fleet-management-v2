#!/usr/bin/env node

import { chromium } from 'playwright'

async function testLogin() {
  console.log('🚀 Starting login test...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Click on Admin Dashboard (or Login)
    console.log('🔍 Looking for login/sign in button...')
    const loginButton = page.getByRole('link', { name: /admin dashboard|sign in|login/i }).first()

    if (await loginButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Found login button, clicking...')
      await loginButton.click()
      await page.waitForTimeout(1500)
    } else {
      console.log('⚠️  No login button found on landing page, navigating directly to /auth/login')
      await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })
    }

    // Wait for login page to load
    console.log('⏳ Waiting for login form...')
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })

    console.log('📝 Login page loaded successfully!')
    console.log('📸 Taking screenshot of login page...')
    await page.screenshot({ path: 'login-page-screenshot.png', fullPage: true })
    console.log('✅ Screenshot saved: login-page-screenshot.png')

    // Try to fill in test credentials (you can customize these)
    console.log('\n🔑 Attempting to fill login credentials...')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

    // Test credentials - update these with your actual test credentials
    const testEmail = 'admin@test.com'
    const testPassword = 'password123'

    await emailInput.fill(testEmail)
    console.log(`✅ Filled email: ${testEmail}`)

    await passwordInput.fill(testPassword)
    console.log('✅ Filled password: ********')

    // Take screenshot before submitting
    await page.screenshot({ path: 'login-form-filled.png', fullPage: true })
    console.log('📸 Screenshot saved: login-form-filled.png')

    // Look for submit button
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i })

    if (await submitButton.isVisible({ timeout: 3000 })) {
      console.log('\n🚀 Clicking login button...')
      await submitButton.click()

      // Wait for navigation or error
      await page.waitForTimeout(3000)

      const currentUrl = page.url()
      console.log(`📍 Current URL: ${currentUrl}`)

      // Take screenshot of result
      await page.screenshot({ path: 'login-result.png', fullPage: true })
      console.log('📸 Screenshot saved: login-result.png')

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful! Redirected to dashboard')
      } else if (currentUrl.includes('/portal')) {
        console.log('✅ Login successful! Redirected to portal')
      } else {
        console.log('⚠️  Still on login page - check for error messages')

        // Look for error messages
        const errorText = await page.textContent('body').catch(() => '')
        if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('invalid')) {
          console.log('❌ Error detected on page')
        }
      }
    } else {
      console.log('❌ Could not find submit button')
    }

    console.log('\n✨ Test complete! Browser will stay open for 10 seconds...')
    await page.waitForTimeout(10000)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
    console.log('📸 Error screenshot saved: error-screenshot.png')
  } finally {
    await browser.close()
    console.log('🔚 Browser closed')
  }
}

testLogin()
