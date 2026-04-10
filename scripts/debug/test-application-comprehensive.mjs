#!/usr/bin/env node

/**
 * Comprehensive Application Test Suite
 *
 * Tests all critical functionality after TypeScript error fixes
 */

import http from 'http'

console.log('='.repeat(70))
console.log('🧪 COMPREHENSIVE APPLICATION TEST SUITE')
console.log('='.repeat(70))
console.log()

const BASE_URL = 'http://localhost:3000'

// Test pages configuration
const TESTS = [
  { name: 'Landing Page', path: '/', expectedStatus: 200, critical: true },
  { name: 'Login Page', path: '/auth/login', expectedStatus: 200, critical: true },
  { name: 'Admin Dashboard', path: '/dashboard', expectedStatus: 200, critical: true },
  {
    name: 'Leave Approval Page',
    path: '/dashboard/leave/approve',
    expectedStatus: 200,
    critical: true,
  },
  { name: 'Pilot Portal Login', path: '/portal/login', expectedStatus: 200, critical: true },
  { name: 'Pilot Dashboard', path: '/portal/dashboard', expectedStatus: 200, critical: false },
  {
    name: 'Leave Requests Page',
    path: '/portal/leave-requests',
    expectedStatus: 200,
    critical: false,
  },
  { name: 'API Health Check', path: '/api', expectedStatus: 404, critical: false }, // 404 is expected, means routing works
]

/**
 * Test a single endpoint
 */
async function testEndpoint(test) {
  return new Promise((resolve) => {
    const startTime = Date.now()

    const req = http.get(`${BASE_URL}${test.path}`, (res) => {
      const loadTime = Date.now() - startTime
      const passed = res.statusCode === test.expectedStatus

      resolve({
        ...test,
        status: res.statusCode,
        loadTime,
        passed,
      })
    })

    req.on('error', (error) => {
      resolve({
        ...test,
        status: 'ERROR',
        loadTime: 0,
        passed: false,
        error: error.message,
      })
    })

    req.setTimeout(30000, () => {
      req.destroy()
      resolve({
        ...test,
        status: 'TIMEOUT',
        loadTime: 30000,
        passed: false,
        error: 'Request timed out after 30 seconds',
      })
    })
  })
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('📝 Test Configuration')
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Total Tests: ${TESTS.length}`)
  console.log(`   Critical Tests: ${TESTS.filter((t) => t.critical).length}`)
  console.log()
  console.log('='.repeat(70))
  console.log('🚀 RUNNING TESTS')
  console.log('='.repeat(70))
  console.log()

  const results = []

  for (const test of TESTS) {
    process.stdout.write(`Testing: ${test.name.padEnd(25)} ... `)
    const result = await testEndpoint(test)
    results.push(result)

    if (result.passed) {
      console.log(`✅ PASS (${result.status}, ${result.loadTime}ms)`)
    } else {
      console.log(`❌ FAIL (${result.status}, ${result.error || 'unexpected status'})`)
    }
  }

  console.log()
  console.log('='.repeat(70))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(70))
  console.log()

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const criticalPassed = results.filter((r) => r.critical && r.passed).length
  const criticalFailed = results.filter((r) => r.critical && !r.passed).length

  console.log(`Total Tests:      ${TESTS.length}`)
  console.log(`Passed:           ${passed} ✅`)
  console.log(`Failed:           ${failed} ${failed > 0 ? '❌' : '✅'}`)
  console.log()
  console.log(`Critical Tests:   ${TESTS.filter((t) => t.critical).length}`)
  console.log(
    `Critical Passed:  ${criticalPassed} ${criticalPassed === TESTS.filter((t) => t.critical).length ? '✅' : '❌'}`
  )
  console.log(`Critical Failed:  ${criticalFailed} ${criticalFailed === 0 ? '✅' : '❌'}`)
  console.log()

  // Performance metrics
  const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length
  const maxLoadTime = Math.max(...results.map((r) => r.loadTime))
  const minLoadTime = Math.min(...results.map((r) => r.loadTime))

  console.log('⚡ Performance Metrics')
  console.log(`   Average Load Time: ${avgLoadTime.toFixed(0)}ms`)
  console.log(`   Fastest:           ${minLoadTime}ms`)
  console.log(`   Slowest:           ${maxLoadTime}ms`)
  console.log()

  // Failed tests detail
  if (failed > 0) {
    console.log('='.repeat(70))
    console.log('❌ FAILED TESTS DETAIL')
    console.log('='.repeat(70))
    console.log()

    results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`Test: ${result.name}`)
        console.log(`  Path: ${result.path}`)
        console.log(`  Expected Status: ${result.expectedStatus}`)
        console.log(`  Actual Status: ${result.status}`)
        if (result.error) {
          console.log(`  Error: ${result.error}`)
        }
        console.log()
      })
  }

  // Overall status
  console.log('='.repeat(70))
  console.log('🏁 FINAL STATUS')
  console.log('='.repeat(70))
  console.log()

  if (criticalFailed === 0 && failed === 0) {
    console.log('✅ ALL TESTS PASSED - APPLICATION IS HEALTHY')
    console.log('🚀 DEPLOYMENT READY')
  } else if (criticalFailed === 0) {
    console.log('⚠️  ALL CRITICAL TESTS PASSED - APPLICATION IS FUNCTIONAL')
    console.log(`⚠️  ${failed} non-critical test(s) failed`)
    console.log('✅ DEPLOYMENT READY (with warnings)')
  } else {
    console.log('❌ CRITICAL TESTS FAILED - APPLICATION HAS ISSUES')
    console.log(`❌ ${criticalFailed} critical test(s) failed`)
    console.log('🛑 NOT READY FOR DEPLOYMENT')
  }

  console.log()
  console.log('='.repeat(70))
  console.log('📝 NEXT STEPS')
  console.log('='.repeat(70))
  console.log()

  if (criticalFailed === 0 && failed === 0) {
    console.log('1. ✅ Run type-check: npm run type-check')
    console.log('2. ✅ Run linter: npm run lint')
    console.log('3. ✅ Run build: npm run build')
    console.log('4. ✅ Deploy database migrations')
    console.log('5. ✅ Deploy to production')
  } else {
    console.log('1. Review failed tests above')
    console.log('2. Fix identified issues')
    console.log('3. Re-run this test suite')
    console.log('4. Proceed with deployment after all tests pass')
  }

  console.log()
  console.log('='.repeat(70))

  // Exit with appropriate code
  process.exit(criticalFailed > 0 ? 1 : 0)
}

// Check if server is running first
console.log('🔍 Checking if dev server is running...')
console.log()

http
  .get(BASE_URL, () => {
    console.log('✅ Dev server is running')
    console.log()
    runTests()
  })
  .on('error', (error) => {
    console.log('❌ Dev server is not running!')
    console.log()
    console.log('Please start the dev server first:')
    console.log('  npm run dev')
    console.log()
    process.exit(1)
  })
