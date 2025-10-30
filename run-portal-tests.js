/**
 * Master Test Runner for Fleet Management V2
 * Runs comprehensive tests for both Admin and Pilot portals
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================================================
// Configuration
// ============================================================================
const TESTS = {
  admin: {
    name: 'Admin Portal',
    script: 'test-admin-portal-comprehensive.js',
    emoji: '🔐'
  },
  pilot: {
    name: 'Pilot Portal',
    script: 'test-pilot-portal-comprehensive.js',
    emoji: '✈️'
  }
}

// ============================================================================
// Utility Functions
// ============================================================================
const logSection = (title) => {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${title}`)
  console.log('='.repeat(80))
}

const logInfo = (message) => console.log(`ℹ️  ${message}`)
const logSuccess = (message) => console.log(`✅ ${message}`)
const logError = (message) => console.log(`❌ ${message}`)

// ============================================================================
// Test Runner Function
// ============================================================================
function runTest(testKey) {
  return new Promise((resolve, reject) => {
    const test = TESTS[testKey]
    const scriptPath = join(__dirname, test.script)

    logSection(`${test.emoji} Running ${test.name} Tests`)

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env }
    })

    child.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${test.name} tests completed successfully`)
        resolve({ name: test.name, success: true })
      } else {
        logError(`${test.name} tests failed with exit code ${code}`)
        resolve({ name: test.name, success: false, code })
      }
    })

    child.on('error', (error) => {
      logError(`Failed to run ${test.name} tests: ${error.message}`)
      reject({ name: test.name, error })
    })
  })
}

// ============================================================================
// Main Test Suite Runner
// ============================================================================
async function runAllTests() {
  logSection('🚀 FLEET MANAGEMENT V2 - COMPREHENSIVE PORTAL TESTING')

  console.log('\nStarting comprehensive testing suite...')
  console.log('This will test both Admin and Pilot portals\n')

  const results = []

  try {
    // Check if dev server is running
    logInfo('Make sure your development server is running on http://localhost:3000')
    logInfo('You can start it with: npm run dev\n')

    // Wait 3 seconds to give user time to read
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Run Admin Portal Tests
    const adminResult = await runTest('admin')
    results.push(adminResult)

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Run Pilot Portal Tests
    const pilotResult = await runTest('pilot')
    results.push(pilotResult)

    // Print Final Summary
    logSection('📊 FINAL TEST SUMMARY')
    console.log('\nTest Results:')
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌'
      const status = result.success ? 'PASSED' : 'FAILED'
      console.log(`${index + 1}. ${icon} ${result.name}: ${status}`)
    })

    const allPassed = results.every(r => r.success)
    const passedCount = results.filter(r => r.success).length
    const totalCount = results.length

    console.log(`\nTotal: ${passedCount}/${totalCount} test suites passed`)

    if (allPassed) {
      console.log('\n🎉 ALL TEST SUITES PASSED!')
      console.log('Both Admin and Pilot portals are functioning correctly!')
    } else {
      console.log('\n⚠️  Some test suites failed. Please review the output above.')
    }

    console.log('\n' + '='.repeat(80))

    process.exit(allPassed ? 0 : 1)

  } catch (error) {
    logError(`Test runner failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// ============================================================================
// CLI Interface
// ============================================================================
const args = process.argv.slice(2)

if (args.length === 0) {
  // Run all tests
  runAllTests().catch(console.error)
} else if (args[0] === 'admin') {
  // Run only admin tests
  runTest('admin')
    .then(result => process.exit(result.success ? 0 : 1))
    .catch(() => process.exit(1))
} else if (args[0] === 'pilot') {
  // Run only pilot tests
  runTest('pilot')
    .then(result => process.exit(result.success ? 0 : 1))
    .catch(() => process.exit(1))
} else {
  console.log('Usage:')
  console.log('  node run-portal-tests.js        # Run all tests')
  console.log('  node run-portal-tests.js admin  # Run admin portal tests only')
  console.log('  node run-portal-tests.js pilot  # Run pilot portal tests only')
  process.exit(1)
}
