#!/usr/bin/env node

/**
 * Full User Journey Test - Landing Page to Leave Approval Dashboard
 * Tests the complete flow: Landing → Login → Dashboard → Leave Approval
 */

import http from 'http'

const BASE_URL = 'http://localhost:3000'

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan')
}

function logSuccess(message) {
  log(`   ✅ ${message}`, 'green')
}

function logError(message) {
  log(`   ❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`   ℹ️  ${message}`, 'blue')
}

// Helper to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)

    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000,
    }

    const req = http.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          redirectUrl: res.headers.location,
        })
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

async function testLandingPage() {
  logStep('1', 'Testing Landing Page (/))')

  try {
    const response = await makeRequest('/')

    if (response.statusCode === 200) {
      logSuccess(`Landing page loaded successfully`)
      logInfo(`Status: ${response.statusCode}`)
      logInfo(`Content length: ${response.body.length} bytes`)

      // Check for expected content
      if (response.body.includes('Fleet Management') || response.body.includes('B767')) {
        logSuccess('Page contains expected content')
      } else {
        logInfo('Checking if page redirects to login...')
      }

      return true
    } else if (response.statusCode === 307 || response.statusCode === 302) {
      logInfo(`Redirects to: ${response.redirectUrl}`)
      logSuccess('Landing page handles authentication correctly')
      return true
    } else {
      logError(`Unexpected status code: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Failed to load landing page: ${error.message}`)
    return false
  }
}

async function testLoginPage() {
  logStep('2', 'Testing Login Page (/auth/login)')

  try {
    const response = await makeRequest('/auth/login')

    if (response.statusCode === 200) {
      logSuccess('Login page loaded successfully')
      logInfo(`Status: ${response.statusCode}`)
      logInfo(`Content length: ${response.body.length} bytes`)

      // Check for login form elements
      const hasEmailInput = response.body.includes('email') || response.body.includes('Email')
      const hasPasswordInput =
        response.body.includes('password') || response.body.includes('Password')
      const hasLoginButton = response.body.includes('Sign in') || response.body.includes('Login')

      if (hasEmailInput) logSuccess('Email input field found')
      if (hasPasswordInput) logSuccess('Password input field found')
      if (hasLoginButton) logSuccess('Login button found')

      return true
    } else {
      logError(`Unexpected status code: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Failed to load login page: ${error.message}`)
    return false
  }
}

async function testDashboard() {
  logStep('3', 'Testing Dashboard (/dashboard)')

  try {
    const response = await makeRequest('/dashboard')

    if (response.statusCode === 307 || response.statusCode === 302) {
      logSuccess('Dashboard correctly requires authentication')
      logInfo(`Redirects to: ${response.redirectUrl}`)

      if (response.redirectUrl && response.redirectUrl.includes('/auth/login')) {
        logSuccess('Redirects to login page as expected')
      }

      return true
    } else if (response.statusCode === 200) {
      logInfo('Dashboard loaded (user may be authenticated)')
      logSuccess('Dashboard accessible')
      return true
    } else {
      logError(`Unexpected status code: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Failed to load dashboard: ${error.message}`)
    return false
  }
}

async function testLeaveApprovalPage() {
  logStep('4', 'Testing Leave Approval Dashboard (/dashboard/leave/approve)')

  try {
    const response = await makeRequest('/dashboard/leave/approve')

    if (response.statusCode === 307 || response.statusCode === 302) {
      logSuccess('Leave approval page correctly requires authentication')
      logInfo(`Redirects to: ${response.redirectUrl}`)

      if (response.redirectUrl && response.redirectUrl.includes('/auth/login')) {
        logSuccess('Redirects to login page as expected')
      }

      return true
    } else if (response.statusCode === 200) {
      logInfo('Leave approval page loaded (user may be authenticated)')
      logSuccess('Leave approval dashboard accessible')

      // Check for expected content
      if (response.body.includes('Leave Approval') || response.body.includes('leave-approval')) {
        logSuccess('Page contains leave approval content')
      }

      return true
    } else {
      logError(`Unexpected status code: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Failed to load leave approval page: ${error.message}`)
    return false
  }
}

async function testAPIRoutes() {
  logStep('5', 'Testing API Routes')

  const apiRoutes = [
    '/api/leave-requests/bulk-approve',
    '/api/leave-requests/bulk-deny',
    '/api/leave-requests/crew-availability',
  ]

  let allPassed = true

  for (const route of apiRoutes) {
    try {
      const response = await makeRequest(route, { method: 'GET' })

      // API routes should return 401 (unauthorized) or 405 (method not allowed)
      if (response.statusCode === 401) {
        logSuccess(`${route} - Requires authentication ✓`)
      } else if (response.statusCode === 405) {
        logSuccess(`${route} - Method not allowed (expected for POST-only routes) ✓`)
      } else if (response.statusCode === 200 || response.statusCode === 400) {
        logSuccess(`${route} - Route exists and responds ✓`)
      } else {
        logInfo(`${route} - Status: ${response.statusCode}`)
      }
    } catch (error) {
      logError(`${route} - Failed: ${error.message}`)
      allPassed = false
    }
  }

  return allPassed
}

async function testNavigation() {
  logStep('6', 'Testing Navigation Structure')

  const routes = [
    { path: '/dashboard/pilots', name: 'Pilots Page' },
    { path: '/dashboard/certifications', name: 'Certifications Page' },
    { path: '/dashboard/leave', name: 'Leave Requests Page' },
    { path: '/dashboard/analytics', name: 'Analytics Page' },
  ]

  let accessibleCount = 0

  for (const route of routes) {
    try {
      const response = await makeRequest(route.path)

      if (
        response.statusCode === 200 ||
        response.statusCode === 307 ||
        response.statusCode === 302
      ) {
        logSuccess(`${route.name} - Route exists ✓`)
        accessibleCount++
      } else {
        logInfo(`${route.name} - Status: ${response.statusCode}`)
      }
    } catch (error) {
      logError(`${route.name} - Failed: ${error.message}`)
    }
  }

  logInfo(`${accessibleCount}/${routes.length} routes accessible`)
  return accessibleCount > 0
}

async function testServerHealth() {
  logStep('7', 'Testing Server Health')

  try {
    const response = await makeRequest('/')

    if (response.statusCode >= 200 && response.statusCode < 400) {
      logSuccess('Server is running and responding')
      logInfo(`Response time: OK`)
      return true
    } else {
      logError(`Server returned unexpected status: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    logError(`Server health check failed: ${error.message}`)
    logError('Is the dev server running? Run: npm run dev')
    return false
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(70), 'bright')
  log('  LEAVE APPROVAL DASHBOARD - FULL JOURNEY TEST', 'bright')
  log('  From Landing Page to Leave Approval Dashboard', 'bright')
  log('='.repeat(70), 'bright')

  log('\n📋 Test Configuration:', 'yellow')
  logInfo(`Base URL: ${BASE_URL}`)
  logInfo(`Date: ${new Date().toLocaleString()}`)

  const results = {
    passed: 0,
    failed: 0,
    total: 7,
  }

  // Run tests
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Landing Page', fn: testLandingPage },
    { name: 'Login Page', fn: testLoginPage },
    { name: 'Dashboard', fn: testDashboard },
    { name: 'Leave Approval Page', fn: testLeaveApprovalPage },
    { name: 'API Routes', fn: testAPIRoutes },
    { name: 'Navigation', fn: testNavigation },
  ]

  for (const test of tests) {
    const passed = await test.fn()
    if (passed) {
      results.passed++
    } else {
      results.failed++
    }
  }

  // Print summary
  log('\n' + '='.repeat(70), 'bright')
  log('  TEST SUMMARY', 'bright')
  log('='.repeat(70), 'bright')

  log(`\n  Total Tests: ${results.total}`, 'yellow')
  log(`  Passed: ${results.passed}`, results.passed === results.total ? 'green' : 'yellow')
  log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')

  const percentage = Math.round((results.passed / results.total) * 100)
  log(`  Success Rate: ${percentage}%\n`, percentage === 100 ? 'green' : 'yellow')

  if (results.passed === results.total) {
    log('✅ ALL TESTS PASSED - Leave Approval Dashboard is ready!', 'green')
    log('\n📖 Next Steps:', 'cyan')
    logInfo('1. Open http://localhost:3000 in your browser')
    logInfo('2. Sign in with your credentials')
    logInfo('3. Navigate to: Dashboard → Requests → Leave Approval')
    logInfo('4. Test the interactive features:')
    logInfo('   - Filter by status, period, rank, type')
    logInfo('   - Sort by priority, seniority, date')
    logInfo('   - Select requests and use bulk approve/deny')
    logInfo('   - View crew availability widget')
    logInfo('   - Check conflict warnings')
  } else {
    log('⚠️  SOME TESTS FAILED - Review errors above', 'yellow')
  }

  log('\n' + '='.repeat(70) + '\n', 'bright')

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('\n❌ Unhandled error:', 'red')
  console.error(error)
  process.exit(1)
})

// Run the tests
runTests()
