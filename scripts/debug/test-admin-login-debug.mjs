import { chromium } from 'playwright'

console.log('🔍 DEBUG: Testing Admin Login in Real Browser')
console.log('='.repeat(80))
console.log()

async function testAdminLogin() {
  let browser
  let context
  let page

  try {
    // Launch browser
    console.log('🚀 Launching Chromium...')
    browser = await chromium.launch({
      headless: false, // Show the browser
      slowMo: 500, // Slow down actions to see what's happening
    })

    context = await browser.newContext()
    page = await context.newPage()

    // Enable console logging from the browser
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()))
    page.on('pageerror', (error) => console.log('BROWSER ERROR:', error))

    // Navigate to login page
    console.log('📄 Navigating to login page...')
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })

    // Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png' })
    console.log('📸 Screenshot saved: debug-login-page.png')

    // Wait for form to be visible
    console.log('⏳ Waiting for login form...')
    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    await page.waitForSelector('input[name="password"]', { timeout: 10000 })
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 })
    console.log('✅ Login form found')

    // Fill in credentials
    console.log('✍️  Filling in credentials...')
    await page.fill('input[name="email"]', 'skycruzer@icloud.com')
    await page.fill('input[name="password"]', 'mron2393')

    // Take screenshot before submit
    await page.screenshot({ path: 'debug-before-submit.png' })
    console.log('📸 Screenshot saved: debug-before-submit.png')

    // Click submit
    console.log('🔘 Clicking submit button...')
    await page.click('button[type="submit"]')

    // Wait a bit to see what happens
    console.log('⏳ Waiting for response...')
    await page.waitForTimeout(3000)

    // Take screenshot after submit
    await page.screenshot({ path: 'debug-after-login.png' })
    console.log('📸 Screenshot saved: debug-after-login.png')

    // Check current URL
    const currentUrl = page.url()
    console.log('📍 Current URL:', currentUrl)

    // Check if we're on dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard!')

      // Wait for dashboard to load
      await page.waitForTimeout(2000)

      // Take dashboard screenshot
      await page.screenshot({ path: 'debug-dashboard.png' })
      console.log('📸 Screenshot saved: debug-dashboard.png')

      return true
    } else if (currentUrl.includes('/auth/login')) {
      console.log('❌ FAILED: Still on login page')

      // Check for error messages
      const errorElement = await page.$('.text-destructive, [role="alert"], .error')
      if (errorElement) {
        const errorText = await errorElement.textContent()
        console.log('❌ Error message:', errorText)
      }

      // Check URL params for error
      const url = new URL(currentUrl)
      const error = url.searchParams.get('error')
      const message = url.searchParams.get('message')
      if (error || message) {
        console.log('❌ URL Error:', error)
        console.log('❌ URL Message:', message)
      }

      return false
    } else {
      console.log('⚠️  Unexpected URL:', currentUrl)
      return false
    }
  } catch (error) {
    console.log('❌ Test Error:', error.message)
    console.log(error.stack)

    if (page) {
      await page.screenshot({ path: 'debug-error.png' })
      console.log('📸 Error screenshot saved: debug-error.png')
    }

    return false
  } finally {
    // Keep browser open for manual inspection
    console.log()
    console.log('⏸️  Browser will remain open for 30 seconds for manual inspection...')
    await page.waitForTimeout(30000)

    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }
  }
}

testAdminLogin()
  .then((success) => {
    console.log()
    console.log('='.repeat(80))
    if (success) {
      console.log('✅ ADMIN LOGIN TEST: PASSED')
    } else {
      console.log('❌ ADMIN LOGIN TEST: FAILED')
    }
    console.log('='.repeat(80))
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
