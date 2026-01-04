/**
 * Comprehensive Local Testing Script
 * Tests admin and pilot portals for login and critical functionality
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const errors = []
const warnings = []
const successes = []

function log(type, message) {
  const timestamp = new Date().toISOString()
  const entry = `[${timestamp}] ${type.toUpperCase()}: ${message}`
  console.log(entry)

  if (type === 'error') errors.push(message)
  else if (type === 'warning') warnings.push(message)
  else if (type === 'success') successes.push(message)
}

async function testAdminLogin(browser) {
  log('info', '=== TESTING ADMIN PORTAL LOGIN ===')
  const context = await browser.newContext()
  const page = await context.newPage()

  // Track console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      log('error', `Admin Console Error: ${msg.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    log('error', `Admin Page Error: ${error.message}`)
  })

  try {
    // Navigate to admin login
    log('info', 'Navigating to /dashboard...')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })

    // Check if redirected to login
    const url = page.url()
    log('info', `Current URL: ${url}`)

    if (url.includes('/auth/login')) {
      log('success', 'Correctly redirected to login page')

      // Take screenshot
      await page.screenshot({ path: 'screenshots/admin-login-page.png' })
      log('success', 'Screenshot saved: admin-login-page.png')

      // Check for form elements
      const emailInput = await page.locator('input[type="email"]').count()
      const passwordInput = await page.locator('input[type="password"]').count()
      const submitButton = await page.locator('button[type="submit"]').count()

      if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
        log('success', 'Login form elements found')

        // Try to login with correct credentials
        log('info', 'Attempting login...')
        await page.fill('input[type="email"]', 'skycruzer@icloud.com')
        await page.fill('input[type="password"]', 'mron2393')
        await page.screenshot({ path: 'screenshots/admin-before-submit.png' })

        await page.click('button[type="submit"]')
        await page.waitForTimeout(3000)

        const afterLoginUrl = page.url()
        await page.screenshot({ path: 'screenshots/admin-after-login.png' })
        log('info', `After login URL: ${afterLoginUrl}`)

        if (afterLoginUrl.includes('/dashboard')) {
          log('success', 'Admin login successful - redirected to dashboard')
        } else if (afterLoginUrl.includes('/auth/login')) {
          log('error', 'Admin login failed - still on login page')

          // Check for error messages
          const errorMessages = await page
            .locator('[role="alert"], .error, .text-red-500')
            .allTextContents()
          if (errorMessages.length > 0) {
            log('error', `Login error messages: ${errorMessages.join(', ')}`)
          }
        } else {
          log('warning', `Unexpected redirect after login: ${afterLoginUrl}`)
        }
      } else {
        log('error', 'Login form elements missing')
      }
    } else if (url.includes('/dashboard')) {
      log('warning', 'Already authenticated - no login required')
    } else {
      log('error', `Unexpected redirect: ${url}`)
    }
  } catch (error) {
    log('error', `Admin login test failed: ${error.message}`)
  } finally {
    await context.close()
  }
}

async function testPilotPortalLogin(browser) {
  log('info', '=== TESTING PILOT PORTAL LOGIN ===')
  const context = await browser.newContext()
  const page = await context.newPage()

  // Track console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      log('error', `Pilot Console Error: ${msg.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    log('error', `Pilot Page Error: ${error.message}`)
  })

  try {
    // Navigate to pilot portal login
    log('info', 'Navigating to /portal/login...')
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle' })

    const url = page.url()
    log('info', `Current URL: ${url}`)

    // Take screenshot
    await page.screenshot({ path: 'screenshots/pilot-login-page.png' })
    log('success', 'Screenshot saved: pilot-login-page.png')

    // Check for form elements
    const emailInput = await page.locator('input[type="email"], input[name="email"]').count()
    const passwordInput = await page.locator('input[type="password"]').count()
    const submitButton = await page.locator('button[type="submit"]').count()

    if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
      log('success', 'Pilot login form elements found')

      // Try to login with correct pilot credentials
      log('info', 'Attempting pilot login...')
      const employeeInput = page.locator('input[type="email"], input[name="email"]').first()
      await employeeInput.fill('mrondeau@airniugini.com.pg')
      await page.fill('input[type="password"]', 'Lemakot@1972')
      await page.screenshot({ path: 'screenshots/pilot-before-submit.png' })

      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)

      const afterLoginUrl = page.url()
      await page.screenshot({ path: 'screenshots/pilot-after-login.png' })
      log('info', `After pilot login URL: ${afterLoginUrl}`)

      if (
        afterLoginUrl.includes('/portal/dashboard') ||
        afterLoginUrl.includes('/portal/certifications')
      ) {
        log('success', 'Pilot login successful - redirected to portal dashboard')
      } else if (afterLoginUrl.includes('/portal/login')) {
        log('error', 'Pilot login failed - still on login page')

        // Check for error messages
        const errorMessages = await page
          .locator('[role="alert"], .error, .text-red-500')
          .allTextContents()
        if (errorMessages.length > 0) {
          log('error', `Pilot login error messages: ${errorMessages.join(', ')}`)
        }
      } else {
        log('warning', `Unexpected redirect after pilot login: ${afterLoginUrl}`)
      }
    } else {
      log('error', 'Pilot login form elements missing')
    }
  } catch (error) {
    log('error', `Pilot portal login test failed: ${error.message}`)
  } finally {
    await context.close()
  }
}

async function testCriticalPages(browser) {
  log('info', '=== TESTING CRITICAL PAGES ===')
  const context = await browser.newContext()
  const page = await context.newPage()

  const pagesToTest = [
    { url: '/', name: 'Homepage' },
    { url: '/dashboard', name: 'Admin Dashboard' },
    { url: '/portal/login', name: 'Pilot Login' },
    { url: '/api/health', name: 'Health Check API' },
  ]

  for (const pageTest of pagesToTest) {
    try {
      log('info', `Testing ${pageTest.name}: ${pageTest.url}`)
      const response = await page.goto(`${BASE_URL}${pageTest.url}`, {
        waitUntil: 'networkidle',
        timeout: 10000,
      })

      if (response.ok()) {
        log('success', `${pageTest.name} loaded successfully (${response.status()})`)
      } else {
        log('error', `${pageTest.name} returned error: ${response.status()}`)
      }
    } catch (error) {
      log('error', `Failed to load ${pageTest.name}: ${error.message}`)
    }
  }

  await context.close()
}

async function main() {
  log('info', 'Starting comprehensive local testing...')
  log('info', `Testing against: ${BASE_URL}`)

  const browser = await chromium.launch({ headless: false })

  try {
    await testCriticalPages(browser)
    await testAdminLogin(browser)
    await testPilotPortalLogin(browser)
  } catch (error) {
    log('error', `Test suite failed: ${error.message}`)
  } finally {
    await browser.close()
  }

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Successes: ${successes.length}`)
  console.log(`⚠️  Warnings: ${warnings.length}`)
  console.log(`❌ Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('ERRORS FOUND:')
    console.log('='.repeat(80))
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`)
    })
  }

  if (warnings.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('WARNINGS:')
    console.log('='.repeat(80))
    warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn}`)
    })
  }

  console.log('\n' + '='.repeat(80))

  // Exit with error code if tests failed
  if (errors.length > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
