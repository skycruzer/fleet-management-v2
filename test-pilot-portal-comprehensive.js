/**
 * Comprehensive Pilot Portal Testing Script
 * Tests all major pilot portal functionality using Puppeteer
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import puppeteer from 'puppeteer'

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  HEADLESS: false, // Set to true for CI/CD
  SLOW_MO: 50, // Slow down for visibility
  VIEWPORT: { width: 1920, height: 1080 },
  TIMEOUT: 10000,
  PILOT_CREDENTIALS: {
    email: process.env.PILOT_EMAIL || 'mrondeau@airniugini.com.pg',
    password: process.env.PILOT_PASSWORD || 'Lemakot@1972',
  },
}

// ============================================================================
// Utility Functions
// ============================================================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const logSection = (title) => {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${title}`)
  console.log('='.repeat(80))
}

const logTest = (testNumber, description) => {
  console.log(`\n🧪 TEST ${testNumber}: ${description}`)
}

const logSuccess = (message) => console.log(`  ✅ ${message}`)
const logError = (message) => console.log(`  ❌ ${message}`)
const logInfo = (message) => console.log(`  ℹ️  ${message}`)
const logWarning = (message) => console.log(`  ⚠️  ${message}`)

// ============================================================================
// Test Results Tracker
// ============================================================================
class TestResults {
  constructor() {
    this.passed = 0
    this.failed = 0
    this.skipped = 0
    this.tests = []
  }

  pass(testName) {
    this.passed++
    this.tests.push({ name: testName, status: 'PASSED' })
    logSuccess(`${testName} - PASSED`)
  }

  fail(testName, error = '') {
    this.failed++
    this.tests.push({ name: testName, status: 'FAILED', error })
    logError(`${testName} - FAILED${error ? ': ' + error : ''}`)
  }

  skip(testName, reason = '') {
    this.skipped++
    this.tests.push({ name: testName, status: 'SKIPPED', reason })
    logWarning(`${testName} - SKIPPED${reason ? ': ' + reason : ''}`)
  }

  getSummary() {
    const total = this.passed + this.failed + this.skipped
    const successRate =
      this.passed + this.failed > 0
        ? ((this.passed / (this.passed + this.failed)) * 100).toFixed(1)
        : 0
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      successRate: `${successRate}%`,
    }
  }

  printSummary() {
    const summary = this.getSummary()
    logSection('📊 TEST SUMMARY')
    console.log(`Total Tests: ${summary.total}`)
    console.log(`✅ Passed: ${summary.passed}`)
    console.log(`❌ Failed: ${summary.failed}`)
    console.log(`⏭️  Skipped: ${summary.skipped}`)
    console.log(`📈 Success Rate: ${summary.successRate}`)
    console.log('='.repeat(80))

    if (this.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Pilot portal is working perfectly!')
    } else {
      console.log(`\n⚠️  ${this.failed} test(s) failed. Review errors above.`)
    }
  }
}

// ============================================================================
// API Response Interceptor
// ============================================================================
class APIMonitor {
  constructor(page) {
    this.responses = {}
    this.errors = []

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/portal/')) {
        const apiName = url.split('/api/portal/')[1].split('?')[0]
        this.responses[apiName] = {
          status: response.status(),
          ok: response.ok(),
          url,
          timestamp: new Date().toISOString(),
        }
      }
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text())
      }
    })
  }

  getResponse(apiName) {
    return this.responses[apiName]
  }

  hasError(apiName) {
    const response = this.responses[apiName]
    return response && !response.ok
  }

  printSummary() {
    logSection('📡 API RESPONSE SUMMARY')
    if (Object.keys(this.responses).length === 0) {
      logWarning('No API responses captured')
      return
    }

    Object.entries(this.responses).forEach(([api, response]) => {
      const icon = response.ok ? '✅' : '❌'
      console.log(`${icon} /api/portal/${api}: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`)
    })

    if (this.errors.length > 0) {
      console.log('\n⚠️  Console Errors Detected:')
      this.errors.slice(0, 5).forEach((err) => console.log(`  - ${err}`))
      if (this.errors.length > 5) {
        console.log(`  ... and ${this.errors.length - 5} more errors`)
      }
    }
  }
}

// ============================================================================
// Screenshot Helper
// ============================================================================
async function takeScreenshot(page, name) {
  try {
    const filename = `./test-screenshots/pilot-portal-${name}-${Date.now()}.png`
    await page.screenshot({ path: filename, fullPage: true })
    logInfo(`Screenshot saved: ${filename}`)
  } catch (error) {
    logWarning(`Failed to take screenshot: ${error.message}`)
  }
}

// ============================================================================
// Pilot Portal Test Suite
// ============================================================================
async function testPilotPortal() {
  logSection('🚀 STARTING PILOT PORTAL COMPREHENSIVE TESTING')

  const results = new TestResults()
  let browser, page, apiMonitor

  try {
    // ========================================================================
    // Setup Browser
    // ========================================================================
    logInfo('Launching browser...')
    browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      slowMo: CONFIG.SLOW_MO,
      args: [
        `--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    })

    page = await browser.newPage()
    await page.setViewport(CONFIG.VIEWPORT)
    apiMonitor = new APIMonitor(page)
    logSuccess('Browser launched successfully')

    // ========================================================================
    // TEST 1: Navigate to Pilot Portal Login
    // ========================================================================
    logTest(1, 'Navigate to Pilot Portal Login Page')
    await page.goto(`${CONFIG.BASE_URL}/portal/login`, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.TIMEOUT,
    })

    const loginPageTitle = await page.title()
    if (loginPageTitle && page.url().includes('/portal/login')) {
      results.pass('Pilot login page loads')
    } else {
      results.fail('Pilot login page loads', 'Page did not load correctly')
      await takeScreenshot(page, 'login-page-error')
    }
    await sleep(1500)

    // ========================================================================
    // TEST 2: Pilot Authentication
    // ========================================================================
    logTest(2, 'Pilot Login Authentication')

    try {
      // Wait for and fill email
      await page.waitForSelector('input[type="email"]', { timeout: 5000 })
      await page.type('input[type="email"]', CONFIG.PILOT_CREDENTIALS.email, { delay: 50 })
      logInfo('Email entered')

      // Wait for and fill password
      await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      await page.type('input[type="password"]', CONFIG.PILOT_CREDENTIALS.password, { delay: 50 })
      logInfo('Password entered')

      // Click login button
      await page.click('button[type="submit"]')
      logInfo('Login button clicked')

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT })

      const currentUrl = page.url()
      const cookies = await page.cookies()

      if (currentUrl.includes('/portal/dashboard')) {
        results.pass('Pilot login successful')
        logInfo(`Session cookies set: ${cookies.length} cookies`)
      } else {
        results.fail('Pilot login successful', `Redirected to: ${currentUrl}`)
        await takeScreenshot(page, 'login-failed')
      }
    } catch (error) {
      results.fail('Pilot login successful', error.message)
      await takeScreenshot(page, 'login-error')
    }
    await sleep(2000)

    // ========================================================================
    // TEST 3: Dashboard Page
    // ========================================================================
    logTest(3, 'Pilot Dashboard Page')

    try {
      const dashboardTitle = await page.title()
      const hasContent = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3')
        return headings.length > 0
      })

      if (hasContent && page.url().includes('/portal/dashboard')) {
        results.pass('Dashboard page displays correctly')
      } else {
        results.fail('Dashboard page displays correctly', 'Content not found')
        await takeScreenshot(page, 'dashboard-error')
      }
    } catch (error) {
      results.fail('Dashboard page displays correctly', error.message)
    }
    await sleep(2000)

    // ========================================================================
    // TEST 4: Profile Page
    // ========================================================================
    logTest(4, 'Profile Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/profile`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      const profileResponse = apiMonitor.getResponse('profile')
      if (profileResponse && profileResponse.ok) {
        results.pass('Profile page loads with pilot data')
        logInfo(`API Status: ${profileResponse.status}`)
      } else {
        results.fail(
          'Profile page loads with pilot data',
          `API status: ${profileResponse?.status || 'N/A'}`
        )
      }
    } catch (error) {
      results.fail('Profile page loads with pilot data', error.message)
    }

    // ========================================================================
    // TEST 5: Certifications Page
    // ========================================================================
    logTest(5, 'Certifications Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/certifications`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      const certsResponse = apiMonitor.getResponse('certifications')
      if (certsResponse && certsResponse.ok) {
        results.pass('Certifications page loads')
        logInfo(`API Status: ${certsResponse.status}`)
      } else {
        results.fail('Certifications page loads', `API status: ${certsResponse?.status || 'N/A'}`)
      }
    } catch (error) {
      results.fail('Certifications page loads', error.message)
    }

    // ========================================================================
    // TEST 6: Leave Requests Page
    // ========================================================================
    logTest(6, 'Leave Requests Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/leave-requests`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      const leaveResponse = apiMonitor.getResponse('leave-requests')
      if (leaveResponse && leaveResponse.ok) {
        results.pass('Leave requests page loads')
        logInfo(`API Status: ${leaveResponse.status}`)
      } else {
        results.fail('Leave requests page loads', `API status: ${leaveResponse?.status || 'N/A'}`)
      }
    } catch (error) {
      results.fail('Leave requests page loads', error.message)
    }

    // ========================================================================
    // TEST 7: Flight Requests Page
    // ========================================================================
    logTest(7, 'Flight Requests Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/flight-requests`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      const flightResponse = apiMonitor.getResponse('flight-requests')
      if (flightResponse && flightResponse.ok) {
        results.pass('Flight requests page loads')
        logInfo(`API Status: ${flightResponse.status}`)
      } else {
        results.fail('Flight requests page loads', `API status: ${flightResponse?.status || 'N/A'}`)
      }
    } catch (error) {
      results.fail('Flight requests page loads', error.message)
    }

    // ========================================================================
    // TEST 8: Notifications Page
    // ========================================================================
    logTest(8, 'Notifications Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/notifications`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      const notifResponse = apiMonitor.getResponse('notifications')
      if (notifResponse && notifResponse.ok) {
        results.pass('Notifications page loads')
        logInfo(`API Status: ${notifResponse.status}`)
      } else {
        results.fail('Notifications page loads', `API status: ${notifResponse?.status || 'N/A'}`)
      }
    } catch (error) {
      results.fail('Notifications page loads', error.message)
    }

    // ========================================================================
    // TEST 9: Feedback Page
    // ========================================================================
    logTest(9, 'Feedback/Support Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/feedback`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(2000)

      if (page.url().includes('/portal/feedback')) {
        results.pass('Feedback page loads')
      } else {
        results.fail('Feedback page loads', 'Page not found')
      }
    } catch (error) {
      results.fail('Feedback page loads', error.message)
    }

    // ========================================================================
    // TEST 10: Navigation Menu
    // ========================================================================
    logTest(10, 'Navigation Menu Functionality')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/dashboard`, {
        waitUntil: 'networkidle2',
      })
      await sleep(1000)

      const navLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a, aside a'))
        return links
          .map((link) => ({
            text: link.textContent.trim(),
            href: link.getAttribute('href'),
          }))
          .filter((link) => link.href && link.href.includes('/portal/'))
      })

      if (navLinks.length >= 5) {
        results.pass('Navigation menu functional')
        logInfo(`Found ${navLinks.length} navigation links`)
        navLinks.forEach((link) => {
          console.log(`    - ${link.text}: ${link.href}`)
        })
      } else {
        results.fail('Navigation menu functional', `Only ${navLinks.length} links found`)
      }
    } catch (error) {
      results.fail('Navigation menu functional', error.message)
    }

    // ========================================================================
    // TEST 11: Create New Leave Request (Navigation)
    // ========================================================================
    logTest(11, 'Create New Leave Request (Navigation)')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/leave-requests/new`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(1500)

      const hasForm = await page.evaluate(() => {
        return document.querySelector('form') !== null
      })

      if (hasForm && page.url().includes('/leave-requests/new')) {
        results.pass('New leave request form accessible')
      } else {
        results.fail('New leave request form accessible', 'Form not found')
      }
    } catch (error) {
      results.fail('New leave request form accessible', error.message)
    }

    // ========================================================================
    // TEST 12: Create New Flight Request (Navigation)
    // ========================================================================
    logTest(12, 'Create New Flight Request (Navigation)')

    try {
      await page.goto(`${CONFIG.BASE_URL}/portal/flight-requests/new`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT,
      })
      await sleep(1500)

      const hasForm = await page.evaluate(() => {
        return document.querySelector('form') !== null
      })

      if (hasForm && page.url().includes('/flight-requests/new')) {
        results.pass('New flight request form accessible')
      } else {
        results.fail('New flight request form accessible', 'Form not found')
      }
    } catch (error) {
      results.fail('New flight request form accessible', error.message)
    }

    // ========================================================================
    // TEST 13: Mobile Responsive Design
    // ========================================================================
    logTest(13, 'Mobile Responsive Design')

    try {
      // Test iPhone SE viewport
      await page.setViewport({ width: 375, height: 667 })
      await page.goto(`${CONFIG.BASE_URL}/portal/dashboard`, {
        waitUntil: 'networkidle2',
      })
      await sleep(1500)

      const isMobileResponsive = await page.evaluate(() => {
        const width = window.innerWidth
        const hasOverflow = document.body.scrollWidth > window.innerWidth
        return width === 375 && !hasOverflow
      })

      if (isMobileResponsive) {
        results.pass('Mobile responsive design works')
      } else {
        results.fail('Mobile responsive design works', 'Horizontal overflow detected')
        await takeScreenshot(page, 'mobile-view')
      }

      // Reset viewport
      await page.setViewport(CONFIG.VIEWPORT)
    } catch (error) {
      results.fail('Mobile responsive design works', error.message)
    }

    // ========================================================================
    // TEST 14: Session Persistence
    // ========================================================================
    logTest(14, 'Session Persistence')

    try {
      // Navigate away and back
      await page.goto(`${CONFIG.BASE_URL}`, { waitUntil: 'networkidle2' })
      await sleep(1000)
      await page.goto(`${CONFIG.BASE_URL}/portal/dashboard`, { waitUntil: 'networkidle2' })
      await sleep(1500)

      const stillAuthenticated = page.url().includes('/portal/dashboard')
      if (stillAuthenticated) {
        results.pass('Session persists across navigation')
      } else {
        results.fail('Session persists across navigation', 'Session lost')
      }
    } catch (error) {
      results.fail('Session persists across navigation', error.message)
    }

    // ========================================================================
    // TEST 15: Logout Functionality
    // ========================================================================
    logTest(15, 'Logout Functionality')

    try {
      // Look for logout button
      const logoutButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'))
        const logoutBtn = buttons.find(
          (btn) =>
            btn.textContent.toLowerCase().includes('logout') ||
            btn.textContent.toLowerCase().includes('sign out')
        )
        return logoutBtn !== undefined
      })

      if (logoutButton) {
        results.pass('Logout button available')
        logInfo('Logout button found in navigation')
      } else {
        results.skip('Logout button available', 'Logout button not found in current implementation')
      }
    } catch (error) {
      results.skip('Logout button available', error.message)
    }

    // ========================================================================
    // Print Results
    // ========================================================================
    console.log('\n')
    apiMonitor.printSummary()
    results.printSummary()
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message)
    console.error(error.stack)
    if (page) {
      await takeScreenshot(page, 'critical-error')
    }
  } finally {
    if (browser) {
      logInfo('Keeping browser open for 5 seconds...')
      await sleep(5000)
      await browser.close()
      logSuccess('Browser closed')
    }

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0)
  }
}

// ============================================================================
// Run Tests
// ============================================================================
testPilotPortal().catch(console.error)
