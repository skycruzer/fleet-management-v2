/**
 * Test New Features: Notification Dropdown & Year Selection
 */

import puppeteer from 'puppeteer'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ADMIN_CREDENTIALS: {
    email: 'skycruzer@icloud.com',
    password: 'mron2393',
  },
}

console.log('\n' + '='.repeat(80))
console.log('  🧪 TESTING NEW FEATURES')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 100,
})

const page = await browser.newPage()

// Enable console logging
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log('❌ Browser Error:', msg.text())
  }
})

try {
  // Test 1: Admin Login
  console.log('📝 Test 1: Logging into Admin Portal...')
  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })
  await sleep(500)
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })
  await sleep(500)

  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  await sleep(2000)

  console.log('✅ Login successful\n')

  // Test 2: Navigate to Renewal Planning
  console.log('📝 Test 2: Testing Renewal Planning Year Selection...')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/renewal-planning`, { waitUntil: 'networkidle2' })
  await sleep(3000)

  // Check if year selector exists
  const yearSelector = await page.$('select, [role="combobox"]')
  if (yearSelector) {
    console.log('✅ Year selector found')

    // Check for Previous/Next Year buttons
    const buttonTexts = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons
        .map((btn) => btn.textContent)
        .filter((text) => text.includes('Previous Year') || text.includes('Next Year'))
    })

    if (buttonTexts.length >= 2) {
      console.log('✅ Year navigation buttons found:', buttonTexts)
    } else {
      console.log('❌ Year navigation buttons not found')
    }
  } else {
    console.log('❌ Year selector not found')
  }

  // Test current year display
  const currentYearDisplay = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'))
    const yearElement = elements.find(
      (el) =>
        el.textContent.match(/^\d{4}$/) && el.textContent === new Date().getFullYear().toString()
    )
    return yearElement ? yearElement.textContent : null
  })

  if (currentYearDisplay) {
    console.log(`✅ Current year displayed: ${currentYearDisplay}`)
  }

  await sleep(2000)

  // Test 3: Test Pilot Portal (if we can)
  console.log('\n📝 Test 3: Testing Pilot Portal Notification Bell...')

  // Logout from admin
  await page.goto(`${CONFIG.BASE_URL}/auth/logout`, { waitUntil: 'networkidle2' })
  await sleep(2000)

  // Login as pilot
  await page.goto(`${CONFIG.BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', 'mrondeau@airniugini.com.pg', { delay: 50 })
  await sleep(500)
  await page.type('input[type="password"]', 'Lemakot@1972', { delay: 50 })
  await sleep(500)

  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  await sleep(3000)

  console.log('✅ Pilot login successful')

  // Check for notification bell
  const notificationBell = await page.$('button svg[class*="lucide-bell"]')
  if (notificationBell) {
    console.log('✅ Notification bell found')

    // Click the notification bell
    const bellButton = await page.$('button:has(svg[class*="lucide-bell"])')
    if (bellButton) {
      await bellButton.click()
      await sleep(1500)

      // Check if popover opened
      const popover = await page.$('[role="dialog"], [data-radix-popper-content-wrapper]')
      if (popover) {
        console.log('✅ Notification dropdown opened')

        // Check for notification content
        const hasNotificationHeader = await page.evaluate(() => {
          return document.body.textContent.includes('Notifications')
        })

        if (hasNotificationHeader) {
          console.log('✅ Notification panel content loaded')
        }
      } else {
        console.log('⚠️  Notification dropdown did not open (may need notifications data)')
      }
    }
  } else {
    console.log('❌ Notification bell not found')
  }

  await sleep(2000)

  console.log('\n' + '='.repeat(80))
  console.log('  ✅ ALL TESTS COMPLETED')
  console.log('='.repeat(80))
  console.log('\n💡 Browser will stay open for manual inspection.')
  console.log('   Close browser window when done.\n')

  // Keep browser open
  await new Promise(() => {})
} catch (error) {
  console.error('\n❌ Test Error:', error.message)
  console.error(error.stack)

  console.log('\n💡 Browser will stay open for inspection.')
  await new Promise(() => {})
}
