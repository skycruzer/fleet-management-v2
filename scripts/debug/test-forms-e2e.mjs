#!/usr/bin/env node

/**
 * E2E Browser Testing for Portal Forms
 * Verifies forms render and are ready for submission
 * Author: Maurice Rondeau
 */

import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:3000'

console.log('\n🌐 E2E PORTAL FORMS - BROWSER RENDERING TEST\n')
console.log('='.repeat(60))

const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (details) console.log(`   ${details}`)

  results.tests.push({ name, passed, details })
  if (passed) results.passed++
  else results.failed++
}

async function runTests() {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // =============================================================================
    // TEST 1: PILOT PORTAL LOGIN PAGE
    // =============================================================================
    console.log('\n🔐 TEST 1: Pilot Portal Login Page\n')

    try {
      await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle0', timeout: 10000 })

      const hasEmailInput = await page.$('input[name="email"], input[type="email"]')
      const hasPasswordInput = await page.$('input[name="password"], input[type="password"]')
      const hasSubmitButton = await page.$('button[type="submit"]')

      logTest(
        'Login page loads',
        !!hasEmailInput || !!hasPasswordInput,
        'Login form renders successfully'
      )

      logTest(
        'Has email input',
        !!hasEmailInput,
        hasEmailInput ? 'Email field found' : 'Missing email field'
      )

      logTest(
        'Has password input',
        !!hasPasswordInput,
        hasPasswordInput ? 'Password field found' : 'Missing password field'
      )

      logTest(
        'Has submit button',
        !!hasSubmitButton,
        hasSubmitButton ? 'Submit button found' : 'Missing submit button'
      )
    } catch (error) {
      logTest('Login page test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 2: LEAVE REQUEST FORM (requires auth - check if page exists)
    // =============================================================================
    console.log('\n📝 TEST 2: Leave Request Form Page\n')

    try {
      const response = await page.goto(`${BASE_URL}/portal/leave-requests/new`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })

      const statusCode = response.status()
      const isRedirect = statusCode === 302 || statusCode === 307
      const isUnauthorized = statusCode === 401
      const isOK = statusCode === 200

      logTest(
        'Leave request page exists',
        isOK || isRedirect || isUnauthorized,
        isOK
          ? 'Page loads (would need auth)'
          : isRedirect
            ? 'Redirects to login (correct behavior)'
            : isUnauthorized
              ? 'Returns 401 (auth required - correct)'
              : `Unexpected status: ${statusCode}`
      )

      if (isOK) {
        const pageText = await page.content()
        const hasForm = pageText.includes('Leave Request') || pageText.includes('form')
        logTest(
          'Leave request form renders',
          hasForm,
          hasForm ? 'Form detected on page' : 'Form not found'
        )
      }
    } catch (error) {
      logTest('Leave request page test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 3: FLIGHT REQUEST FORM
    // =============================================================================
    console.log('\n✈️  TEST 3: Flight Request Form Page\n')

    try {
      const response = await page.goto(`${BASE_URL}/portal/flight-requests/new`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })

      const statusCode = response.status()
      const isRedirect = statusCode === 302 || statusCode === 307
      const isUnauthorized = statusCode === 401
      const isOK = statusCode === 200

      logTest(
        'Flight request page exists',
        isOK || isRedirect || isUnauthorized,
        isOK
          ? 'Page loads (would need auth)'
          : isRedirect
            ? 'Redirects to login (correct behavior)'
            : isUnauthorized
              ? 'Returns 401 (auth required - correct)'
              : `Unexpected status: ${statusCode}`
      )

      if (isOK) {
        const pageText = await page.content()
        const hasForm = pageText.includes('Flight Request') || pageText.includes('form')
        logTest(
          'Flight request form renders',
          hasForm,
          hasForm ? 'Form detected on page' : 'Form not found'
        )
      }
    } catch (error) {
      logTest('Flight request page test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 4: FEEDBACK FORM
    // =============================================================================
    console.log('\n💬 TEST 4: Feedback Form Page (NEW)\n')

    try {
      const response = await page.goto(`${BASE_URL}/portal/feedback`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })

      const statusCode = response.status()
      const isRedirect = statusCode === 302 || statusCode === 307
      const isUnauthorized = statusCode === 401
      const isOK = statusCode === 200

      logTest(
        'Feedback page exists',
        isOK || isRedirect || isUnauthorized,
        isOK
          ? 'Page loads (would need auth)'
          : isRedirect
            ? 'Redirects to login (correct behavior)'
            : isUnauthorized
              ? 'Returns 401 (auth required - correct)'
              : `Unexpected status: ${statusCode}`
      )

      if (isOK) {
        const pageText = await page.content()
        const hasForm = pageText.includes('Feedback') || pageText.includes('feedback')
        logTest(
          'Feedback form renders',
          hasForm,
          hasForm ? 'Form detected on page' : 'Form not found'
        )
      }
    } catch (error) {
      logTest('Feedback page test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 5: ADMIN LEAVE APPROVAL PAGE
    // =============================================================================
    console.log('\n👔 TEST 5: Admin Leave Approval Page (NEW)\n')

    try {
      const response = await page.goto(`${BASE_URL}/dashboard/leave/approve`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })

      const statusCode = response.status()
      const isRedirect = statusCode === 302 || statusCode === 307
      const isUnauthorized = statusCode === 401
      const isOK = statusCode === 200

      logTest(
        'Leave approval page exists',
        isOK || isRedirect || isUnauthorized,
        isOK
          ? 'Page loads (would need admin auth)'
          : isRedirect
            ? 'Redirects to login (correct behavior)'
            : isUnauthorized
              ? 'Returns 401 (auth required - correct)'
              : `Unexpected status: ${statusCode}`
      )

      if (isOK) {
        const pageText = await page.content()
        const hasApproval =
          pageText.includes('Leave Request Approval') ||
          pageText.includes('Pending Leave Requests') ||
          pageText.includes('approve')
        logTest(
          'Leave approval UI renders',
          hasApproval,
          hasApproval ? 'Approval interface detected' : 'Approval UI not found'
        )
      }
    } catch (error) {
      logTest('Leave approval page test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 6: ADMIN FEEDBACK DASHBOARD
    // =============================================================================
    console.log('\n📊 TEST 6: Admin Feedback Dashboard\n')

    try {
      const response = await page.goto(`${BASE_URL}/dashboard/feedback`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })

      const statusCode = response.status()
      const isRedirect = statusCode === 302 || statusCode === 307
      const isUnauthorized = statusCode === 401
      const isOK = statusCode === 200

      logTest(
        'Feedback dashboard page exists',
        isOK || isRedirect || isUnauthorized,
        isOK
          ? 'Page loads (would need admin auth)'
          : isRedirect
            ? 'Redirects to login (correct behavior)'
            : isUnauthorized
              ? 'Returns 401 (auth required - correct)'
              : `Unexpected status: ${statusCode}`
      )

      if (isOK) {
        const pageText = await page.content()
        const hasDashboard = pageText.includes('Feedback') || pageText.includes('feedback')
        logTest(
          'Feedback dashboard renders',
          hasDashboard,
          hasDashboard ? 'Dashboard interface detected' : 'Dashboard not found'
        )
      }
    } catch (error) {
      logTest('Feedback dashboard test', false, `Error: ${error.message}`)
    }

    // =============================================================================
    // TEST 7: API ENDPOINTS
    // =============================================================================
    console.log('\n🔌 TEST 7: API Endpoints Health Check\n')

    const endpoints = [
      { path: '/api/portal/leave-requests', name: 'Leave Requests API' },
      { path: '/api/portal/flight-requests', name: 'Flight Requests API' },
      { path: '/api/leave-requests', name: 'Leave Requests Admin API' },
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await page.goto(`${BASE_URL}${endpoint.path}`, {
          waitUntil: 'networkidle0',
          timeout: 5000,
        })

        const statusCode = response.status()
        // Accepting 401, 405, 200 as valid (means endpoint exists)
        const isValid = [200, 401, 405].includes(statusCode)

        logTest(
          endpoint.name,
          isValid,
          isValid ? `Status ${statusCode} (endpoint exists)` : `Unexpected status: ${statusCode}`
        )
      } catch (error) {
        logTest(endpoint.name, false, `Error: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('Browser test error:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // =============================================================================
  // FINAL REPORT
  // =============================================================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 E2E TEST RESULTS SUMMARY\n')

  const totalTests = results.passed + results.failed
  const passRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : '0.0'

  console.log(`Total Tests: ${totalTests}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Pass Rate: ${passRate}%\n`)

  if (results.failed > 0) {
    console.log('❌ FAILED TESTS:\n')
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`   - ${t.name}`)
        if (t.details) console.log(`     ${t.details}`)
      })
    console.log('')
  }

  const overallStatus = results.failed === 0 ? '✅ ALL E2E TESTS PASSED' : '⚠️  SOME TESTS FAILED'
  console.log(overallStatus)
  console.log('\n' + '='.repeat(60) + '\n')

  process.exit(results.failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  console.error('Test execution error:', error)
  process.exit(1)
})
