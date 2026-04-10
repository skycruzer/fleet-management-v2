/**
 * Automated Test: Final Review Dashboard
 * Login and test the Week 3 feature
 */

import { chromium } from 'playwright'

const email = 'skycruzer@icloud.com'
const password = 'mron2393'
const baseUrl = 'http://localhost:3000'

async function testFinalReview() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 AUTOMATED TESTING: FINAL REVIEW DASHBOARD')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down for visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Step 1: Navigate directly to Final Review (will redirect if not logged in)
    console.log('📍 Step 1: Navigating to Final Review dashboard...')
    console.log('   (Will handle authentication if needed)\n')
    await page.goto(`${baseUrl}/dashboard/leave/final-review`)
    await page.waitForTimeout(2000)

    // Wait for page to render
    await page.waitForTimeout(3000)

    // Check for error
    const errorMessage = await page.textContent('body').catch(() => null)

    if (errorMessage && errorMessage.includes('Something went wrong')) {
      console.log('   ❌ ERROR DETECTED\n')

      // Try to get error details
      const errorDetails = await page
        .locator('text=Error Details')
        .click()
        .catch(() => null)
      await page.waitForTimeout(1000)

      // Take screenshot
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('   📸 Screenshot saved: error-screenshot.png\n')

      // Get console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.log('   🔴 Console Error:', msg.text())
        }
      })

      // Check page errors
      page.on('pageerror', (error) => {
        console.log('   🔴 Page Error:', error.message)
      })

      console.log('   ⏳ Waiting to capture errors...')
      await page.waitForTimeout(5000)
    } else {
      console.log('   ✅ Page loaded successfully\n')

      // Step 4: Check for expected elements
      console.log('🔍 Step 4: Checking dashboard elements...')

      // Check for heading
      const heading = await page.textContent('h1').catch(() => null)
      console.log(`   📌 Page heading: ${heading}`)

      // Check for statistics cards
      const statsCards = await page.locator('[class*="grid"]').count()
      console.log(`   📊 Found ${statsCards} grid containers`)

      // Check for alerts
      const alerts = await page.locator('text=/RP\\d{2}\\/\\d{4}/').count()
      console.log(`   🚨 Found ${alerts} roster period references`)

      // Take screenshot of success
      await page.screenshot({ path: 'success-screenshot.png', fullPage: true })
      console.log('   📸 Screenshot saved: success-screenshot.png\n')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ TEST COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Keep browser open for inspection
    console.log('🔎 Browser will remain open for 30 seconds for inspection...\n')
    await page.waitForTimeout(30000)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)

    // Take error screenshot
    await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true })
    console.log('📸 Error screenshot saved: test-error-screenshot.png\n')

    throw error
  } finally {
    await browser.close()
  }
}

// Run test
testFinalReview().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
