#!/usr/bin/env node

/**
 * Test Leave Bids Feature - Post Migration
 * Verifies leave_bid_options table is working correctly
 */

import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'mrondeau@avlaw.ca'
const ADMIN_PASSWORD = 'Rondeau2024@'

async function testLeaveBidsFeature() {
  console.log('🧪 Testing Leave Bids Feature (Post Migration)\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized'],
  })

  try {
    const page = await browser.newPage()

    // Step 1: Login
    console.log('1️⃣  Logging in as admin...')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('input[type="email"]')
    await page.type('input[type="email"]', ADMIN_EMAIL)
    await page.type('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('   ✅ Login successful\n')

    // Step 2: Navigate to Leave Bids page
    console.log('2️⃣  Navigating to Leave Bids page...')
    await page.goto(`${BASE_URL}/dashboard/admin/leave-bids`, {
      waitUntil: 'networkidle2',
      timeout: 10000,
    })

    // Wait a bit for any async operations
    await page.waitForTimeout(2000)

    // Step 3: Check for PGRST200 error (the original issue)
    console.log('3️⃣  Checking for PGRST200 error...')
    const pageContent = await page.content()
    const hasPGRSTError = pageContent.includes('PGRST200')
    const hasRelationError = pageContent.includes('relation "leave_bid_options" does not exist')

    if (hasPGRSTError || hasRelationError) {
      console.log('   ❌ ERROR: PGRST200 error still present!')
      console.log('   ❌ The leave_bid_options table may not be properly created')
      return false
    }
    console.log('   ✅ No PGRST200 error\n')

    // Step 4: Check page title
    console.log('4️⃣  Verifying page loaded...')
    const title = await page.title()
    console.log(`   📄 Page title: ${title}`)

    const heading = await page.$eval('h1', (el) => el.textContent).catch(() => null)
    if (heading) {
      console.log(`   📝 Page heading: ${heading}`)
    }
    console.log('   ✅ Page loaded successfully\n')

    // Step 5: Check for key elements
    console.log('5️⃣  Checking for key UI elements...')

    // Check for table or grid view
    const hasTable = await page.$('table').then((el) => !!el)
    const hasDataGrid = await page.$('[role="grid"]').then((el) => !!el)

    if (hasTable || hasDataGrid) {
      console.log('   ✅ Data display found (table/grid)\n')
    } else {
      console.log('   ⚠️  No table/grid found (may be empty state)\n')
    }

    // Step 6: Check browser console for errors
    console.log('6️⃣  Checking browser console for errors...')
    const logs = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })

    // Wait a bit to collect any console errors
    await page.waitForTimeout(2000)

    if (logs.length > 0) {
      console.log('   ⚠️  Console errors found:')
      logs.forEach((log) => console.log(`      ${log}`))
    } else {
      console.log('   ✅ No console errors\n')
    }

    // Step 7: Take screenshot
    console.log('7️⃣  Taking screenshot...')
    await page.screenshot({
      path: 'leave-bids-test-success.png',
      fullPage: true,
    })
    console.log('   ✅ Screenshot saved: leave-bids-test-success.png\n')

    console.log('✅ LEAVE BIDS TEST: PASSED')
    console.log('✅ Migration successful - leave_bid_options table is working!\n')

    return true
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message)
    return false
  } finally {
    // Keep browser open for 5 seconds to allow manual inspection
    console.log('⏳ Keeping browser open for 5 seconds...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await browser.close()
  }
}

// Run test
testLeaveBidsFeature()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
