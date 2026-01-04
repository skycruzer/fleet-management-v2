#!/usr/bin/env node

import puppeteer from 'puppeteer'

const TEST_PILOT = {
  email: 'test-pilot-1761490042775@airniugini.com.pg',
  password: 'TempPassword123!',
}

console.log('\n🌐 Browser Login Test')
console.log('=====================\n')
console.log(`📧 Email: ${TEST_PILOT.email}`)
console.log(`🔑 Password: ${TEST_PILOT.password}\n`)

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testBrowserLogin() {
  let browser

  try {
    // Launch browser in headed mode so you can see it
    console.log('🚀 Launching browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--window-size=1280,800'],
    })

    const page = await browser.newPage()

    // Enable console logging from the page
    page.on('console', (msg) => {
      const type = msg.type()
      if (type === 'error') {
        console.log(`  [Browser Error]: ${msg.text()}`)
      }
    })

    // Navigate to login page
    console.log('\n📱 Navigating to login page...')
    await page.goto('http://localhost:3000/portal/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    await sleep(2000)

    console.log('✅ Login page loaded')
    await page.screenshot({ path: '/tmp/browser-login-01-page.png' })
    console.log('📸 Screenshot: /tmp/browser-login-01-page.png')

    // Fill in credentials
    console.log('\n✏️  Filling in credentials...')
    await page.waitForSelector('input[name="email"]', { timeout: 5000 })
    await page.type('input[name="email"]', TEST_PILOT.email, { delay: 50 })
    await sleep(500)

    await page.type('input[name="password"]', TEST_PILOT.password, { delay: 50 })
    await sleep(500)

    console.log('✅ Credentials filled')
    await page.screenshot({ path: '/tmp/browser-login-02-filled.png' })
    console.log('📸 Screenshot: /tmp/browser-login-02-filled.png')

    // Click login button
    console.log('\n🔐 Clicking login button...')
    await page.click('button[type="submit"]')
    console.log('✅ Login button clicked')

    // Wait for navigation or error
    console.log('\n⏳ Waiting for response...')
    await sleep(3000)

    // Check current URL
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)

    await page.screenshot({ path: '/tmp/browser-login-03-result.png' })
    console.log('📸 Screenshot: /tmp/browser-login-03-result.png')

    // Check for success or error
    if (currentUrl.includes('/portal/dashboard')) {
      console.log('\n✅ SUCCESS: Redirected to dashboard!')

      // Wait for dashboard to load
      await sleep(2000)
      await page.screenshot({ path: '/tmp/browser-login-04-dashboard.png' })
      console.log('📸 Screenshot: /tmp/browser-login-04-dashboard.png')

      // Check for welcome message or pilot name
      const dashboardText = await page.evaluate(() => document.body.textContent)

      if (
        dashboardText.includes('Test') ||
        dashboardText.includes('Pilot') ||
        dashboardText.includes('Dashboard')
      ) {
        console.log('✅ Dashboard loaded successfully')
      }

      console.log('\n🎉 Browser login test PASSED!')
    } else {
      console.log('\n❌ FAILED: Did not redirect to dashboard')

      // Check for error messages
      const pageText = await page.evaluate(() => document.body.textContent)
      if (pageText.toLowerCase().includes('error') || pageText.toLowerCase().includes('invalid')) {
        console.log('❌ Error message detected on page')
      }
    }

    // Keep browser open for 10 seconds so you can see the result
    console.log('\n⏰ Keeping browser open for 10 seconds...')
    await sleep(10000)
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message)
    if (browser) {
      await browser.screenshot?.({ path: '/tmp/browser-login-error.png' })
    }
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...')
      await browser.close()
      console.log('✅ Browser closed\n')
    }
  }
}

testBrowserLogin()
