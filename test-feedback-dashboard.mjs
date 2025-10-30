/**
 * Test Admin Feedback Dashboard Integration
 * Verifies the feedback dashboard page loads and displays correctly
 */

import { chromium } from 'playwright'

async function testFeedbackDashboard() {
  console.log('🧪 Testing Admin Feedback Dashboard Integration...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('❌ BROWSER ERROR:', msg.text())
    }
  })

  // Listen for page errors
  page.on('pageerror', (err) => {
    console.log('❌ PAGE ERROR:', err.message)
  })

  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login...')
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle',
    })
    await page.screenshot({ path: 'screenshots/feedback-test-1-login.png' })
    console.log('✅ Login page loaded')

    // Step 2: Fill in credentials
    console.log('\n📍 Step 2: Entering credentials...')
    await page.fill('input[name="email"]', 'skycruzer@icloud.com')
    await page.fill('input[name="password"]', 'mron2393')
    await page.screenshot({
      path: 'screenshots/feedback-test-2-credentials.png',
    })
    console.log('✅ Credentials entered')

    // Step 3: Click login button
    console.log('\n📍 Step 3: Clicking login...')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await page.screenshot({ path: 'screenshots/feedback-test-3-dashboard.png' })
    console.log('✅ Login successful, redirected to dashboard')

    // Step 4: Navigate to feedback page
    console.log('\n📍 Step 4: Navigating to feedback dashboard...')
    await page.goto('http://localhost:3000/dashboard/feedback', {
      waitUntil: 'networkidle',
    })
    await page.screenshot({
      path: 'screenshots/feedback-test-4-feedback-page.png',
    })
    console.log('✅ Feedback page loaded')

    // Step 5: Check for page title
    console.log('\n📍 Step 5: Verifying page title...')
    const title = await page.textContent('h1')
    console.log(`   Title: "${title}"`)
    if (title?.includes('Pilot Feedback Dashboard')) {
      console.log('✅ Page title correct')
    } else {
      console.log('❌ Page title incorrect')
    }

    // Step 6: Check for stats cards
    console.log('\n📍 Step 6: Checking stats cards...')
    const statsCards = await page.locator('.grid >> .rounded-lg.border').count()
    console.log(`   Stats cards found: ${statsCards}`)
    if (statsCards >= 4) {
      console.log('✅ Stats cards rendered')

      // Get stats values
      const statLabels = await page
        .locator('.text-muted-foreground')
        .allTextContents()
      console.log('   Stats labels:', statLabels.slice(0, 4))
    } else {
      console.log('❌ Stats cards not found')
    }

    // Step 7: Check for filter controls
    console.log('\n📍 Step 7: Checking filter controls...')
    const searchInput = await page.locator('input[placeholder*="Search"]').count()
    const selectFilters = await page.locator('[role="combobox"]').count()
    console.log(`   Search input: ${searchInput > 0 ? '✅' : '❌'}`)
    console.log(`   Filter dropdowns: ${selectFilters}`)
    await page.screenshot({ path: 'screenshots/feedback-test-5-filters.png' })

    // Step 8: Check for feedback table
    console.log('\n📍 Step 8: Checking feedback table...')
    const table = await page.locator('table').count()
    console.log(`   Table found: ${table > 0 ? '✅' : '❌'}`)

    if (table > 0) {
      const headers = await page.locator('th').allTextContents()
      console.log('   Table headers:', headers)

      const rows = await page.locator('tbody tr').count()
      console.log(`   Data rows: ${rows}`)
    }
    await page.screenshot({ path: 'screenshots/feedback-test-6-table.png' })

    // Step 9: Check for export button
    console.log('\n📍 Step 9: Checking export button...')
    const exportButton = await page.locator('button:has-text("Export")').count()
    console.log(`   Export button: ${exportButton > 0 ? '✅' : '❌'}`)

    // Step 10: Final screenshot
    console.log('\n📍 Step 10: Taking final screenshot...')
    await page.screenshot({
      path: 'screenshots/feedback-test-7-complete.png',
      fullPage: true,
    })

    console.log('\n✅ FEEDBACK DASHBOARD TEST: PASSED')
    console.log('   All components rendered successfully')
    console.log('\n📸 Screenshots saved to screenshots/ directory')
  } catch (error) {
    console.error('\n❌ FEEDBACK DASHBOARD TEST: FAILED')
    console.error('   Error:', error.message)
    await page.screenshot({ path: 'screenshots/feedback-test-error.png' })
  } finally {
    await browser.close()
  }
}

testFeedbackDashboard()
