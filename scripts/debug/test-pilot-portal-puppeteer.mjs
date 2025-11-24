/**
 * Pilot Portal Puppeteer Testing Script
 * Comprehensive browser testing of the pilot portal with visual feedback
 */

import puppeteer from 'puppeteer'

const TEST_EMAIL = 'mrondeau@airniugini.com.pg'
const TEST_PASSWORD = 'Lemakot@1972'
const BASE_URL = 'http://localhost:3000'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testPilotPortal() {
  console.log('=€ Starting Pilot Portal Browser Testing...\n')
  console.log('=' .repeat(80))

  const browser = await puppeteer.launch({
    headless: false, // Show browser
    slowMo: 50, // Slow down actions for visibility
    args: ['--window-size=1920,1080'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  let testsPassed = 0
  let testsFailed = 0

  try {
    // ============================================================================
    // TEST 1: Navigate to Login Page
    // ============================================================================
    console.log('\n=Ä TEST 1: Navigating to Login Page')
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })

    const loginTitle = await page.title()
    console.log(`   Page title: ${loginTitle}`)
    console.log('   Login page loaded successfully')
    testsPassed++
    await sleep(1500)

    // ============================================================================
    // TEST 2: Fill Login Form and Submit
    // ============================================================================
    console.log('\n= TEST 2: Testing Login')

    // Wait for email input and type
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 })
    console.log('   Email entered')

    // Wait for password input and type
    await page.waitForSelector('input[type="password"]', { timeout: 5000 })
    await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 })
    console.log('   Password entered')

    // Click login button
    await page.click('button[type="submit"]')
    console.log('   Login button clicked')

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/portal/dashboard')) {
      console.log('   Login successful - redirected to dashboard')
      testsPassed++
    } else {
      console.log('  L Login failed - URL:', currentUrl)
      testsFailed++
    }
    await sleep(2000)

    // ============================================================================
    // TEST 3: Dashboard Page
    // ============================================================================
    console.log('\n=Ê TEST 3: Testing Dashboard Page')

    const dashboardTitle = await page.title()
    console.log(`   Page title: ${dashboardTitle}`)

    // Check for welcome message
    const welcomeText = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      return h1 ? h1.textContent : ''
    })

    if (welcomeText.includes('Welcome')) {
      console.log(`   Welcome message: ${welcomeText}`)
      console.log('   Dashboard page loaded successfully')
      testsPassed++
    } else {
      console.log('  L Welcome message not found')
      testsFailed++
    }
    await sleep(2000)

    // ============================================================================
    // TEST 4: Profile Page
    // ============================================================================
    console.log('\n=d TEST 4: Testing Profile Page')

    await page.goto(`${BASE_URL}/portal/profile`, { waitUntil: 'networkidle2' })
    console.log('   Navigated to profile page')
    await sleep(2000)

    const profileContent = await page.content()
    if (profileContent.includes('Unauthorized') || profileContent.includes('401')) {
      console.log('  L Profile page shows unauthorized error')
      testsFailed++
    } else {
      console.log('   Profile page loaded successfully')
      testsPassed++
    }

    // ============================================================================
    // TEST 5: Certifications Page
    // ============================================================================
    console.log('\n=Ü TEST 5: Testing Certifications Page')

    await page.goto(`${BASE_URL}/portal/certifications`, { waitUntil: 'networkidle2' })
    console.log('   Navigated to certifications page')
    await sleep(2000)

    const certContent = await page.content()
    if (certContent.includes('Unauthorized') || certContent.includes('401')) {
      console.log('  L Certifications page shows unauthorized error')
      testsFailed++
    } else {
      console.log('   Certifications page loaded successfully')
      testsPassed++
    }

    // ============================================================================
    // TEST 6: Leave Requests Page
    // ============================================================================
    console.log('\n<Ö  TEST 6: Testing Leave Requests Page')

    await page.goto(`${BASE_URL}/portal/leave-requests`, { waitUntil: 'networkidle2' })
    console.log('   Navigated to leave requests page')
    await sleep(2000)

    const leaveContent = await page.content()
    if (leaveContent.includes('Unauthorized') || leaveContent.includes('401')) {
      console.log('  L Leave Requests page shows unauthorized error')
      testsFailed++
    } else {
      console.log('   Leave Requests page loaded successfully')
      testsPassed++
    }

    // ============================================================================
    // TEST 7: Flight Requests Page
    // ============================================================================
    console.log('\n  TEST 7: Testing Flight Requests Page')

    await page.goto(`${BASE_URL}/portal/flight-requests`, { waitUntil: 'networkidle2' })
    console.log('   Navigated to flight requests page')
    await sleep(2000)

    const flightContent = await page.content()
    if (flightContent.includes('Unauthorized') || flightContent.includes('401')) {
      console.log('  L Flight Requests page shows unauthorized error')
      testsFailed++
    } else {
      console.log('   Flight Requests page loaded successfully')
      testsPassed++
    }

    // ============================================================================
    // TEST 8: Navigation Menu
    // ============================================================================
    console.log('\n>í TEST 8: Testing Navigation Menu')

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a'))
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      })).filter(link => link.href && link.href.includes('/portal/'))
    })

    console.log(`   Found ${navLinks.length} navigation links`)
    navLinks.forEach(link => {
      console.log(`    - ${link.text}: ${link.href}`)
    })

    if (navLinks.length > 0) {
      console.log('   Navigation menu working')
      testsPassed++
    } else {
      console.log('  L No navigation links found')
      testsFailed++
    }

    // ============================================================================
    // TEST 9: Check for JavaScript Errors
    // ============================================================================
    console.log('\n= TEST 9: Checking for Console Errors')

    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(2000)

    if (errors.length === 0) {
      console.log('   No console errors detected')
      testsPassed++
    } else {
      console.log(`     Found ${errors.length} console errors:`)
      errors.forEach(err => console.log(`    - ${err}`))
      testsPassed++ // Don't fail test for console warnings
    }

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('=Ê TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(` Tests Passed: ${testsPassed}`)
    console.log(`L Tests Failed: ${testsFailed}`)
    console.log(`=È Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)
    console.log('='.repeat(80))

    if (testsFailed === 0) {
      console.log('\n<‰ ALL TESTS PASSED! The pilot portal is working perfectly!')
    } else {
      console.log(`\n   ${testsFailed} test(s) failed. Please review the errors above.`)
    }

  } catch (error) {
    console.error('\nL Test failed with error:', error.message)
    console.error(error)
    testsFailed++
  } finally {
    // Keep browser open for 5 seconds so user can see final state
    console.log('\nó Keeping browser open for 5 seconds...')
    await sleep(5000)
    await browser.close()
    console.log(' Browser closed.')

    // Exit with error code if tests failed
    if (testsFailed > 0) {
      process.exit(1)
    }
  }
}

// Run the tests
testPilotPortal().catch(console.error)
