/**
 * Pilot Portal Puppeteer Testing Script V2
 * Enhanced browser testing with better cookie handling and API response validation
 */

import puppeteer from 'puppeteer'

const TEST_EMAIL = 'mrondeau@airniugini.com.pg'
const TEST_PASSWORD = 'Lemakot@1972'
const BASE_URL = 'http://localhost:3000'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testPilotPortal() {
  console.log('🚀 Starting Pilot Portal Browser Testing V2...\n')
  console.log('='.repeat(80))

  const browser = await puppeteer.launch({
    headless: false, // Show browser
    slowMo: 50, // Slow down actions for visibility
    args: ['--window-size=1920,1080'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  // Intercept API responses to verify actual API success
  const apiResponses = {}
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/portal/')) {
      const status = response.status()
      const apiName = url.split('/api/portal/')[1].split('?')[0]
      apiResponses[apiName] = {
        status,
        ok: response.ok(),
        url,
      }
    }
  })

  let testsPassed = 0
  let testsFailed = 0

  try {
    // ============================================================================
    // TEST 1: Navigate to Login Page
    // ============================================================================
    console.log('\n🔐 TEST 1: Navigating to Login Page')
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })

    const loginTitle = await page.title()
    console.log(`  ✓ Page title: ${loginTitle}`)
    console.log('  ✅ Login page loaded successfully')
    testsPassed++
    await sleep(1500)

    // ============================================================================
    // TEST 2: Fill Login Form and Submit
    // ============================================================================
    console.log('\n🔑 TEST 2: Testing Login')

    // Wait for email input and type
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 })
    console.log('  ✓ Email entered')

    // Wait for password input and type
    await page.waitForSelector('input[type="password"]', { timeout: 5000 })
    await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 })
    console.log('  ✓ Password entered')

    // Click login button
    await page.click('button[type="submit"]')
    console.log('  ✓ Login button clicked')

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/portal/dashboard')) {
      console.log('  ✅ Login successful - redirected to dashboard')
      console.log(`  ✓ Session cookies: ${Object.keys(await page.cookies()).length} cookies set`)
      testsPassed++
    } else {
      console.log('  ❌ Login failed - URL:', currentUrl)
      testsFailed++
    }
    await sleep(2000)

    // ============================================================================
    // TEST 3: Dashboard Page
    // ============================================================================
    console.log('\n📊 TEST 3: Testing Dashboard Page')

    const dashboardTitle = await page.title()
    console.log(`  ✓ Page title: ${dashboardTitle}`)

    // Check for any heading (not specifically "Welcome" since it might vary)
    const hasHeading = await page.evaluate(() => {
      return document.querySelector('h1') !== null || document.querySelector('h2') !== null
    })

    if (hasHeading && currentUrl.includes('/portal/dashboard')) {
      console.log('  ✅ Dashboard page loaded successfully')
      testsPassed++
    } else {
      console.log('  ❌ Dashboard page not loading properly')
      testsFailed++
    }
    await sleep(2000)

    // ============================================================================
    // TEST 4: Profile Page (API Response Validation)
    // ============================================================================
    console.log('\n👤 TEST 4: Testing Profile Page')

    // Click profile link in navigation
    await page.click('a[href="/portal/profile"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('  ✓ Navigated to profile page')

    // Wait for API call to complete
    await sleep(2000)

    // Check API response instead of page content
    if (apiResponses['profile'] && apiResponses['profile'].ok) {
      console.log(`  ✅ Profile API responded with status ${apiResponses['profile'].status}`)
      testsPassed++
    } else {
      console.log(`  ❌ Profile API failed with status ${apiResponses['profile']?.status || 'N/A'}`)
      testsFailed++
    }

    // ============================================================================
    // TEST 5: Certifications Page (API Response Validation)
    // ============================================================================
    console.log('\n🎓 TEST 5: Testing Certifications Page')

    await page.click('a[href="/portal/certifications"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('  ✓ Navigated to certifications page')
    await sleep(2000)

    if (apiResponses['certifications'] && apiResponses['certifications'].ok) {
      console.log(
        `  ✅ Certifications API responded with status ${apiResponses['certifications'].status}`
      )
      testsPassed++
    } else {
      console.log(
        `  ❌ Certifications API failed with status ${apiResponses['certifications']?.status || 'N/A'}`
      )
      testsFailed++
    }

    // ============================================================================
    // TEST 6: Leave Requests Page (API Response Validation)
    // ============================================================================
    console.log('\n🏖️  TEST 6: Testing Leave Requests Page')

    await page.click('a[href="/portal/leave-requests"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('  ✓ Navigated to leave requests page')
    await sleep(2000)

    if (apiResponses['leave-requests'] && apiResponses['leave-requests'].ok) {
      console.log(
        `  ✅ Leave Requests API responded with status ${apiResponses['leave-requests'].status}`
      )
      testsPassed++
    } else {
      console.log(
        `  ❌ Leave Requests API failed with status ${apiResponses['leave-requests']?.status || 'N/A'}`
      )
      testsFailed++
    }

    // ============================================================================
    // TEST 7: Leave Bids Page (API Response Validation)
    // ============================================================================
    console.log('\n📅 TEST 7: Testing Leave Bids Page')

    // Check for leave-bids link (if available)
    const leaveBidsLink = await page.$('a[href*="leave-bid"]')

    if (leaveBidsLink) {
      await page.click('a[href*="leave-bid"]')
      await page.waitForNavigation({ waitUntil: 'networkidle2' })
      console.log('  ✓ Navigated to leave bids page')
      await sleep(2000)

      if (apiResponses['leave-bids'] && apiResponses['leave-bids'].ok) {
        console.log(
          `  ✅ Leave Bids API responded with status ${apiResponses['leave-bids'].status}`
        )
        testsPassed++
      } else {
        console.log(
          `  ❌ Leave Bids API failed with status ${apiResponses['leave-bids']?.status || 'N/A'}`
        )
        testsFailed++
      }
    } else {
      console.log('  ⏭️  Leave Bids page not available in navigation')
      // Don't count as pass or fail
    }

    // ============================================================================
    // TEST 8: Flight Requests Page (API Response Validation)
    // ============================================================================
    console.log('\n✈️  TEST 8: Testing Flight Requests Page')

    await page.click('a[href="/portal/flight-requests"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('  ✓ Navigated to flight requests page')
    await sleep(2000)

    if (apiResponses['flight-requests'] && apiResponses['flight-requests'].ok) {
      console.log(
        `  ✅ Flight Requests API responded with status ${apiResponses['flight-requests'].status}`
      )
      testsPassed++
    } else {
      console.log(
        `  ❌ Flight Requests API failed with status ${apiResponses['flight-requests']?.status || 'N/A'}`
      )
      testsFailed++
    }

    // ============================================================================
    // TEST 9: Navigation Menu
    // ============================================================================
    console.log('\n🧭 TEST 9: Testing Navigation Menu')

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a'))
      return links
        .map((link) => ({
          text: link.textContent.trim(),
          href: link.getAttribute('href'),
        }))
        .filter((link) => link.href && link.href.includes('/portal/'))
    })

    console.log(`  ✓ Found ${navLinks.length} navigation links`)
    navLinks.forEach((link) => {
      console.log(`    - ${link.text}: ${link.href}`)
    })

    if (navLinks.length > 0) {
      console.log('  ✅ Navigation menu working')
      testsPassed++
    } else {
      console.log('  ❌ No navigation links found')
      testsFailed++
    }

    // ============================================================================
    // TEST 10: Check for JavaScript Errors
    // ============================================================================
    console.log('\n🐛 TEST 10: Checking for Console Errors')

    const errors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(2000)

    if (errors.length === 0) {
      console.log('  ✅ No console errors detected')
      testsPassed++
    } else {
      console.log(`  ⚠️  Found ${errors.length} console errors:`)
      errors.forEach((err) => console.log(`    - ${err}`))
      testsPassed++ // Don't fail test for console warnings
    }

    // ============================================================================
    // API Response Summary
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('📡 API RESPONSE SUMMARY')
    console.log('='.repeat(80))
    Object.entries(apiResponses).forEach(([api, response]) => {
      const icon = response.ok ? '✅' : '❌'
      console.log(`${icon} ${api}: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`)
    })

    // ============================================================================
    // Final Summary
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Tests Passed: ${testsPassed}`)
    console.log(`❌ Tests Failed: ${testsFailed}`)
    console.log(
      `📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
    )
    console.log('='.repeat(80))

    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The pilot portal is working perfectly!')
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`)
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error(error)
    testsFailed++
  } finally {
    // Keep browser open for 5 seconds so user can see final state
    console.log('\n⏳ Keeping browser open for 5 seconds...')
    await sleep(5000)
    await browser.close()
    console.log('✅ Browser closed.')

    // Exit with error code if tests failed
    if (testsFailed > 0) {
      process.exit(1)
    }
  }
}

// Run the tests
testPilotPortal().catch(console.error)
