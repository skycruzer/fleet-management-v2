#!/usr/bin/env node

/**
 * Manual Browser Testing Helper
 * Opens a browser window for manual testing of the Leave Approval Dashboard
 */

import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'

async function openBrowserForTesting() {
  console.log('\n🌐 Opening browser for manual testing...\n')

  // Launch browser in headed mode (visible)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down actions by 500ms for visibility
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  console.log('📖 Manual Testing Guide:')
  console.log('='.repeat(70))
  console.log('\n1. Browser will open to the login page')
  console.log('2. Enter your credentials:')
  console.log('   - Email: skycruzer@example.com (or your admin email)')
  console.log('   - Password: [your password]')
  console.log('\n3. After login, navigate to: Dashboard → Requests → Leave Approval')
  console.log('\n4. Test the following features:')
  console.log('   ✓ Filter by Status (PENDING, APPROVED, DENIED)')
  console.log('   ✓ Filter by Roster Period')
  console.log('   ✓ Filter by Rank (Captain, First Officer)')
  console.log('   ✓ Filter by Leave Type')
  console.log('   ✓ Sort by Priority, Seniority, Date')
  console.log('   ✓ Select multiple leave requests')
  console.log('   ✓ Click "Bulk Approve" or "Bulk Deny"')
  console.log('   ✓ View Crew Availability Widget')
  console.log('   ✓ Check for conflict warnings')
  console.log('\n5. Browser will stay open until you close it manually')
  console.log('='.repeat(70))

  console.log('\n🚀 Opening login page...\n')

  // Navigate to login page
  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  console.log('✅ Login page loaded at:', page.url())
  console.log('\n👉 You can now interact with the browser manually')
  console.log('👉 The browser will stay open until you close it')
  console.log('\n📸 Taking screenshot of login page...')

  await page.screenshot({
    path: 'test-results/manual-01-login-page.png',
    fullPage: true
  })

  console.log('✅ Screenshot saved: test-results/manual-01-login-page.png')

  // Optional: Auto-navigate after a delay
  console.log('\n⏳ Waiting for you to log in...')
  console.log('ℹ️  After you log in, I will automatically navigate to Leave Approval')

  // Wait for navigation to dashboard (indicating login success)
  try {
    await page.waitForURL('**/dashboard/**', { timeout: 120000 }) // Wait up to 2 minutes
    console.log('\n✅ Login detected! Navigating to Leave Approval Dashboard...')

    await page.goto(`${BASE_URL}/dashboard/leave/approve`)
    await page.waitForLoadState('networkidle')

    console.log('✅ Leave Approval Dashboard loaded!')
    console.log('\n📸 Taking screenshot...')

    await page.screenshot({
      path: 'test-results/manual-02-leave-approval.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: test-results/manual-02-leave-approval.png')
    console.log('\n👉 You can now test all the features!')
    console.log('👉 Browser will stay open - close manually when done\n')

  } catch (error) {
    console.log('\nℹ️  Login timeout - you can navigate manually')
    console.log('👉 Go to: Dashboard → Requests → Leave Approval\n')
  }

  // Keep the browser open indefinitely
  await new Promise(() => {}) // Never resolves
}

// Run the function
openBrowserForTesting().catch(console.error)
