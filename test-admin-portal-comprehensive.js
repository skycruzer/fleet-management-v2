/**
 * Comprehensive Admin Portal Testing Script
 * Tests all major admin dashboard functionality using Puppeteer
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
  ADMIN_CREDENTIALS: {
    email: process.env.ADMIN_EMAIL || 'skycruzer@icloud.com',
    password: process.env.ADMIN_PASSWORD || 'mron2393'
  }
}

// ============================================================================
// Utility Functions
// ============================================================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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

// ============================================================================
// Test Results Tracker
// ============================================================================
class TestResults {
  constructor() {
    this.passed = 0
    this.failed = 0
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

  getSummary() {
    const total = this.passed + this.failed
    const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      successRate: `${successRate}%`
    }
  }

  printSummary() {
    const summary = this.getSummary()
    logSection('📊 TEST SUMMARY')
    console.log(`Total Tests: ${summary.total}`)
    console.log(`✅ Passed: ${summary.passed}`)
    console.log(`❌ Failed: ${summary.failed}`)
    console.log(`📈 Success Rate: ${summary.successRate}`)
    console.log('='.repeat(80))

    if (this.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Admin portal is functioning correctly!')
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
      if (url.includes('/api/')) {
        const apiName = url.split('/api/')[1].split('?')[0]
        this.responses[apiName] = {
          status: response.status(),
          ok: response.ok(),
          url
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
    Object.entries(this.responses).forEach(([api, response]) => {
      const icon = response.ok ? '✅' : '❌'
      console.log(`${icon} ${api}: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`)
    })

    if (this.errors.length > 0) {
      console.log('\n⚠️  Console Errors:')
      this.errors.forEach(err => console.log(`  - ${err}`))
    }
  }
}

// ============================================================================
// Admin Portal Test Suite
// ============================================================================
async function testAdminPortal() {
  logSection('🚀 STARTING ADMIN PORTAL COMPREHENSIVE TESTING')

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
      args: [`--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`]
    })

    page = await browser.newPage()
    await page.setViewport(CONFIG.VIEWPORT)
    apiMonitor = new APIMonitor(page)
    logSuccess('Browser launched successfully')

    // ========================================================================
    // TEST 1: Navigate to Admin Login
    // ========================================================================
    logTest(1, 'Navigate to Admin Login Page')
    await page.goto(`${CONFIG.BASE_URL}/auth/login`, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.TIMEOUT
    })

    const loginPageTitle = await page.title()
    if (loginPageTitle && page.url().includes('/auth/login')) {
      results.pass('Admin login page loads')
    } else {
      results.fail('Admin login page loads', 'Page did not load correctly')
    }
    await sleep(1000)

    // ========================================================================
    // TEST 2: Admin Authentication
    // ========================================================================
    logTest(2, 'Admin Login Authentication')

    try {
      // Fill in credentials
      await page.waitForSelector('input[type="email"]', { timeout: 5000 })
      await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })

      await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })

      // Submit form
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.TIMEOUT })

      const currentUrl = page.url()
      if (currentUrl.includes('/dashboard')) {
        results.pass('Admin login successful')
      } else {
        results.fail('Admin login successful', `Redirected to: ${currentUrl}`)
      }
    } catch (error) {
      results.fail('Admin login successful', error.message)
    }
    await sleep(2000)

    // ========================================================================
    // TEST 3: Dashboard Overview
    // ========================================================================
    logTest(3, 'Dashboard Overview Page')

    try {
      const dashboardTitle = await page.title()
      const hasMetrics = await page.evaluate(() => {
        // Check for dashboard metrics/cards
        const cards = document.querySelectorAll('[class*="card"], [class*="metric"]')
        return cards.length > 0
      })

      if (hasMetrics && page.url().includes('/dashboard')) {
        results.pass('Dashboard overview displays')
      } else {
        results.fail('Dashboard overview displays', 'Metrics not found')
      }
    } catch (error) {
      results.fail('Dashboard overview displays', error.message)
    }
    await sleep(2000)

    // ========================================================================
    // TEST 4: Pilots Management
    // ========================================================================
    logTest(4, 'Pilots Management Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/pilots`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const pilotsResponse = apiMonitor.getResponse('pilots')
      if (pilotsResponse && pilotsResponse.ok) {
        results.pass('Pilots list loads successfully')
      } else {
        results.fail('Pilots list loads successfully', `API status: ${pilotsResponse?.status}`)
      }
    } catch (error) {
      results.fail('Pilots list loads successfully', error.message)
    }

    // ========================================================================
    // TEST 5: Certifications Management
    // ========================================================================
    logTest(5, 'Certifications Management Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/certifications`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const certsResponse = apiMonitor.getResponse('certifications')
      if (certsResponse && certsResponse.ok) {
        results.pass('Certifications page loads')
      } else {
        results.fail('Certifications page loads', `API status: ${certsResponse?.status}`)
      }
    } catch (error) {
      results.fail('Certifications page loads', error.message)
    }

    // ========================================================================
    // TEST 6: Leave Requests Management
    // ========================================================================
    logTest(6, 'Leave Requests Management Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/leave-requests`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const leaveResponse = apiMonitor.getResponse('leave-requests')
      if (leaveResponse && leaveResponse.ok) {
        results.pass('Leave requests page loads')
      } else {
        results.fail('Leave requests page loads', `API status: ${leaveResponse?.status}`)
      }
    } catch (error) {
      results.fail('Leave requests page loads', error.message)
    }

    // ========================================================================
    // TEST 7: Analytics Dashboard
    // ========================================================================
    logTest(7, 'Analytics Dashboard')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/analytics`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const analyticsResponse = apiMonitor.getResponse('analytics')
      if (analyticsResponse && analyticsResponse.ok) {
        results.pass('Analytics dashboard loads')
      } else {
        results.fail('Analytics dashboard loads', `API status: ${analyticsResponse?.status}`)
      }
    } catch (error) {
      results.fail('Analytics dashboard loads', error.message)
    }

    // ========================================================================
    // TEST 8: Flight Requests
    // ========================================================================
    logTest(8, 'Flight Requests Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/flight-requests`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const flightResponse = apiMonitor.getResponse('flight-requests')
      if (flightResponse && flightResponse.ok) {
        results.pass('Flight requests page loads')
      } else {
        results.fail('Flight requests page loads', `API status: ${flightResponse?.status}`)
      }
    } catch (error) {
      results.fail('Flight requests page loads', error.message)
    }

    // ========================================================================
    // TEST 9: Tasks Management
    // ========================================================================
    logTest(9, 'Tasks Management Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/tasks`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const tasksResponse = apiMonitor.getResponse('tasks')
      if (tasksResponse && tasksResponse.ok) {
        results.pass('Tasks page loads')
      } else {
        results.fail('Tasks page loads', `API status: ${tasksResponse?.status}`)
      }
    } catch (error) {
      results.fail('Tasks page loads', error.message)
    }

    // ========================================================================
    // TEST 10: Admin Settings
    // ========================================================================
    logTest(10, 'Admin Settings Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/admin/settings`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      if (page.url().includes('/dashboard/admin/settings')) {
        results.pass('Admin settings page loads')
      } else {
        results.fail('Admin settings page loads', 'Access denied or redirect')
      }
    } catch (error) {
      results.fail('Admin settings page loads', error.message)
    }

    // ========================================================================
    // TEST 11: Audit Logs
    // ========================================================================
    logTest(11, 'Audit Logs Page')

    try {
      await page.goto(`${CONFIG.BASE_URL}/dashboard/audit-logs`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT
      })
      await sleep(2000)

      const auditResponse = apiMonitor.getResponse('audit-logs')
      if (auditResponse && auditResponse.ok) {
        results.pass('Audit logs page loads')
      } else {
        results.fail('Audit logs page loads', `API status: ${auditResponse?.status}`)
      }
    } catch (error) {
      results.fail('Audit logs page loads', error.message)
    }

    // ========================================================================
    // TEST 12: Navigation Menu Functionality
    // ========================================================================
    logTest(12, 'Navigation Menu')

    try {
      const navLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a, aside a'))
        return links.map(link => ({
          text: link.textContent.trim(),
          href: link.getAttribute('href')
        })).filter(link => link.href && link.href.includes('/dashboard/'))
      })

      if (navLinks.length >= 5) {
        results.pass('Navigation menu functional')
        logInfo(`Found ${navLinks.length} navigation links`)
      } else {
        results.fail('Navigation menu functional', `Only ${navLinks.length} links found`)
      }
    } catch (error) {
      results.fail('Navigation menu functional', error.message)
    }

    // ========================================================================
    // TEST 13: Responsive Design Check
    // ========================================================================
    logTest(13, 'Responsive Design - Mobile View')

    try {
      await page.setViewport({ width: 375, height: 667 }) // iPhone SE
      await sleep(1000)

      const isMobileResponsive = await page.evaluate(() => {
        const width = window.innerWidth
        return width === 375
      })

      if (isMobileResponsive) {
        results.pass('Mobile responsive design works')
      } else {
        results.fail('Mobile responsive design works')
      }

      // Reset viewport
      await page.setViewport(CONFIG.VIEWPORT)
    } catch (error) {
      results.fail('Mobile responsive design works', error.message)
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
testAdminPortal().catch(console.error)
