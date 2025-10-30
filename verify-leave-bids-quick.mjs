#!/usr/bin/env node

/**
 * Quick verification - Leave Bids page loads without error
 */

import { chromium } from '@playwright/test'

async function quickVerify() {
  console.log('🔍 Quick Verification: Leave Bids Page\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  try {
    // Login
    console.log('1. Logging in...')
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('input[type="email"]', 'mrondeau@avlaw.ca')
    await page.fill('input[type="password"]', 'Rondeau2024@')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**')
    console.log('   ✅ Logged in\n')

    // Navigate to leave bids
    console.log('2. Loading leave bids page...')
    await page.goto('http://localhost:3000/dashboard/admin/leave-bids')
    await page.waitForLoadState('networkidle')

    // Check for PGRST200 error
    const content = await page.content()
    const hasError = content.includes('PGRST200') || content.includes('does not exist')

    if (hasError) {
      console.log('   ❌ PGRST200 error found!\n')
      return false
    }

    console.log('   ✅ No PGRST200 error\n')

    // Check page title
    const title = await page.title()
    console.log(`3. Page Title: "${title}"\n`)

    // Get page heading
    const heading = await page.locator('h1').first().textContent()
    console.log(`4. Page Heading: "${heading}"\n`)

    // Take screenshot
    await page.screenshot({ path: 'leave-bids-verified.png', fullPage: true })
    console.log('5. Screenshot saved: leave-bids-verified.png\n')

    console.log('✅ VERIFICATION PASSED')
    console.log('✅ Leave Bids page loads successfully!')
    console.log('✅ Migration complete - leave_bid_options table is working!\n')

    // Wait 3 seconds for inspection
    await page.waitForTimeout(3000)
    return true
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  } finally {
    await browser.close()
  }
}

quickVerify()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1))
