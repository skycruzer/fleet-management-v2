/**
 * Full Automated Test: Login + Final Review Dashboard
 */

import { chromium } from 'playwright'

const email = 'skycruzer@icloud.com'
const password = 'mron2393'
const baseUrl = 'http://localhost:3000'

async function testFullFlow() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 FULL AUTOMATED TEST: LOGIN → FINAL REVIEW')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slow down for visibility
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Step 1: Go to landing page
    console.log('📍 Step 1: Loading landing page...')
    await page.goto(baseUrl)
    await page.waitForLoadState('networkidle')
    console.log('   ✅ Landing page loaded\n')
    await page.waitForTimeout(1000)

    // Step 2: Click Sign In
    console.log('🔗 Step 2: Clicking "Sign In" button...')
    const signInButton = page.locator('text=Sign In').first()
    await signInButton.click()
    await page.waitForLoadState('networkidle')
    console.log('   ✅ Navigated to login page\n')
    await page.waitForTimeout(1000)

    // Step 3: Fill in login form
    console.log('🔐 Step 3: Entering credentials...')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    console.log('   ✅ Credentials entered\n')
    await page.waitForTimeout(500)

    // Step 4: Submit login
    console.log('🚀 Step 4: Submitting login...')
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    console.log('   ✅ Login submitted\n')

    // Step 5: Navigate to Final Review
    console.log('📊 Step 5: Navigating to Final Review...')
    await page.goto(`${baseUrl}/dashboard/leave/final-review`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check for error
    const bodyText = await page.textContent('body')

    if (bodyText.includes('Something went wrong') || bodyText.includes('Build Error')) {
      console.log('   ❌ ERROR DETECTED\n')
      await page.screenshot({ path: 'final-review-error.png', fullPage: true })
      console.log('   📸 Screenshot saved: final-review-error.png\n')
    } else if (bodyText.includes('Authentication Required')) {
      console.log('   ⚠️  Not authenticated - showing login prompt\n')
      await page.screenshot({ path: 'final-review-auth-required.png', fullPage: true })
      console.log('   📸 Screenshot saved: final-review-auth-required.png\n')
    } else {
      console.log('   ✅ Final Review Dashboard loaded!\n')

      // Check for expected elements
      console.log('🔍 Step 6: Checking dashboard elements...')

      const heading = await page
        .locator('h1')
        .first()
        .textContent()
        .catch(() => null)
      console.log(`   📌 Heading: ${heading || 'Not found'}`)

      const statsCards = await page.locator('[class*="grid"]').count()
      console.log(`   📊 Grid containers: ${statsCards}`)

      const rosterPeriods = await page.locator('text=/RP\\d{2}\\/\\d{4}/').count()
      console.log(`   🚨 Roster period references: ${rosterPeriods}`)

      await page.screenshot({ path: 'final-review-success.png', fullPage: true })
      console.log('   📸 Screenshot saved: final-review-success.png\n')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ TEST COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('🔎 Browser will remain open for 60 seconds for inspection...\n')
    await page.waitForTimeout(60000)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    await page.screenshot({ path: 'test-error.png', fullPage: true })
    console.log('📸 Error screenshot saved: test-error.png\n')
    throw error
  } finally {
    await browser.close()
  }
}

// Run test
testFullFlow().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
