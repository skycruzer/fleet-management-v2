#!/usr/bin/env node

/**
 * Test Admin Login
 *
 * This script opens the browser and tests the admin login functionality
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

// Admin credentials from .env or test database
const ADMIN_EMAIL = 'admin@fleetmanagement.com'
const ADMIN_PASSWORD = 'Admin123!'

async function testAdminLogin() {
  console.log('🚀 Starting Admin Login Test...\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down actions for visibility
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  try {
    // Step 1: Navigate to home page
    console.log('📍 Step 1: Navigating to home page...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'test-screenshots/01-home-page.png', fullPage: true })
    console.log('✅ Home page loaded\n')

    // Step 2: Navigate to login page
    console.log('📍 Step 2: Navigating to login page...')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'test-screenshots/02-login-page.png', fullPage: true })
    console.log('✅ Login page loaded\n')

    // Step 3: Fill in credentials
    console.log('📍 Step 3: Filling in admin credentials...')

    // Wait for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill(ADMIN_EMAIL)
    console.log(`   ✓ Email: ${ADMIN_EMAIL}`)

    // Wait for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 })
    await passwordInput.fill(ADMIN_PASSWORD)
    console.log('   ✓ Password: ********')

    await page.screenshot({ path: 'test-screenshots/03-credentials-filled.png', fullPage: true })
    console.log('✅ Credentials filled\n')

    // Step 4: Click login button
    console.log('📍 Step 4: Clicking login button...')
    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()
    console.log('✅ Login button clicked\n')

    // Step 5: Wait for redirect to dashboard
    console.log('📍 Step 5: Waiting for dashboard redirect...')

    // Wait for either dashboard or error
    await Promise.race([
      page.waitForURL('**/dashboard**', { timeout: 15000 }),
      page.waitForSelector('.error, [role="alert"]', { timeout: 15000 }),
    ]).catch(() => {
      console.log('⚠️  No immediate redirect or error detected')
    })

    await page.waitForTimeout(2000) // Wait for page to settle

    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    await page.screenshot({ path: 'test-screenshots/04-after-login.png', fullPage: true })

    // Check if we're on the dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully logged in to admin dashboard!\n')

      // Step 6: Verify dashboard elements
      console.log('📍 Step 6: Verifying dashboard elements...')

      // Wait for dashboard content to load
      await page.waitForTimeout(2000)

      // Take final screenshot
      await page.screenshot({ path: 'test-screenshots/05-dashboard-loaded.png', fullPage: true })

      // Check for key dashboard elements
      const hasHeader = (await page.locator('header, [role="banner"]').count()) > 0
      const hasSidebar = (await page.locator('aside, nav').count()) > 0
      const hasContent = (await page.locator('main, [role="main"]').count()) > 0

      console.log(`   ✓ Header present: ${hasHeader}`)
      console.log(`   ✓ Sidebar present: ${hasSidebar}`)
      console.log(`   ✓ Main content present: ${hasContent}`)

      console.log('\n✅ Dashboard verification complete!\n')

      // Keep browser open for 30 seconds for manual inspection
      console.log('🔍 Browser will remain open for 30 seconds for inspection...')
      await page.waitForTimeout(30000)
    } else {
      // Check for error messages
      const errorElement = await page
        .locator('.error, [role="alert"], .text-red-500, .text-destructive')
        .first()
      const errorVisible = await errorElement.isVisible().catch(() => false)

      if (errorVisible) {
        const errorText = await errorElement.textContent()
        console.log(`❌ Login failed with error: ${errorText}\n`)
      } else {
        console.log('❌ Login failed - did not redirect to dashboard\n')
      }

      console.log('📋 Possible issues:')
      console.log('   1. Invalid credentials')
      console.log('   2. User does not exist in database')
      console.log('   3. User role is not "admin"')
      console.log('   4. Supabase authentication issue\n')

      // Keep browser open for inspection
      console.log('🔍 Browser will remain open for 30 seconds for debugging...')
      await page.waitForTimeout(30000)
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    await page.screenshot({ path: 'test-screenshots/error-screenshot.png', fullPage: true })

    // Keep browser open for debugging
    console.log('🔍 Browser will remain open for 30 seconds for debugging...')
    await page.waitForTimeout(30000)
  } finally {
    await browser.close()
    console.log('\n🏁 Test complete!')
  }
}

// Run the test
testAdminLogin()
