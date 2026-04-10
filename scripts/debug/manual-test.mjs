#!/usr/bin/env node
import { chromium } from 'playwright'

async function manualTest() {
  console.log('🚀 Starting Manual Fleet Management V2 Test...\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down so we can see what's happening
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  try {
    // Test 1: Landing Page
    console.log('📄 Test 1: Opening Landing Page...')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'screenshots/test-1-landing.png', fullPage: true })
    console.log('   ✅ Landing page loaded\n')

    // Test 2: Click Get Started
    console.log('🔘 Test 2: Clicking Get Started button...')
    await page.click('text=Get Started')
    await page.waitForURL('**/auth/login')
    await page.screenshot({ path: 'screenshots/test-2-login-page.png', fullPage: true })
    console.log('   ✅ Redirected to login page\n')

    // Test 3: Try login with admin credentials
    console.log('🔐 Test 3: Attempting login with admin credentials...')
    await page.fill('input[type="email"]', 'skycruzer@icloud.com')
    await page.fill('input[type="password"]', 'mron2393')
    await page.screenshot({ path: 'screenshots/test-3-credentials-filled.png', fullPage: true })

    await page.click('button[type="submit"]')
    console.log('   ⏳ Waiting for response...')

    // Wait 5 seconds to see what happens
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'screenshots/test-4-after-login-attempt.png', fullPage: true })

    // Check if we're on dashboard or still on login
    const currentUrl = page.url()
    console.log(`   📍 Current URL: ${currentUrl}`)

    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ Successfully logged in!\n')

      // Test Dashboard
      console.log('📊 Test 4: Testing Dashboard...')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-5-dashboard.png', fullPage: true })
      console.log('   ✅ Dashboard loaded\n')

      // Test Pilots Page
      console.log('👨‍✈️ Test 5: Testing Pilots Page...')
      await page.click('text=Pilots')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-6-pilots.png', fullPage: true })
      console.log('   ✅ Pilots page loaded\n')

      // Test Certifications Page
      console.log('📋 Test 6: Testing Certifications Page...')
      await page.click('text=Certifications')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-7-certifications.png', fullPage: true })
      console.log('   ✅ Certifications page loaded\n')

      // Test Leave Page
      console.log('📅 Test 7: Testing Leave Requests Page...')
      await page.click('text=Leave Requests')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-8-leave.png', fullPage: true })
      console.log('   ✅ Leave page loaded\n')

      // Test Analytics Page
      console.log('📈 Test 8: Testing Analytics Page...')
      await page.click('text=Analytics')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-9-analytics.png', fullPage: true })
      console.log('   ✅ Analytics page loaded\n')

      // Test Admin Page
      console.log('⚙️ Test 9: Testing Admin Page...')
      await page.click('text=Admin')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'screenshots/test-10-admin.png', fullPage: true })
      console.log('   ✅ Admin page loaded\n')
    } else {
      console.log('   ❌ Login failed - still on login page')

      // Check for error message
      const errorElement = await page.$('.text-red-600')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        console.log(`   ❌ Error: ${errorText}`)
      } else {
        console.log('   ⚠️  No error message displayed')
      }
    }

    console.log('\n✨ Test complete! Check screenshots folder for results.')
    console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...')
    await page.waitForTimeout(10000)
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message)
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

manualTest().catch(console.error)
