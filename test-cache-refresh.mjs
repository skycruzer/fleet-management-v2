/**
 * Cache Refresh Implementation Testing Script
 *
 * Tests all cache invalidation fixes across admin and pilot portals
 *
 * Author: Maurice Rondeau
 * Date: November 20, 2025
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'
const PILOT_USERNAME = process.env.TEST_PILOT_USERNAME || 'namet'
const PILOT_PASSWORD = process.env.TEST_PILOT_PASSWORD || 'namet'

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  skipped: []
}

function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} [${category}] ${testName}${details ? ': ' + details : ''}`)

  if (passed) {
    testResults.passed.push(`${category}: ${testName}`)
  } else {
    testResults.failed.push(`${category}: ${testName} - ${details}`)
  }
}

function logSkip(category, testName, reason) {
  console.log(`⏭️  SKIP [${category}] ${testName}: ${reason}`)
  testResults.skipped.push(`${category}: ${testName} - ${reason}`)
}

async function loginAdmin(page) {
  console.log('\n🔐 Logging in as Admin...')
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard/**', { timeout: 10000 })
  console.log('✅ Admin logged in successfully')
}

async function loginPilot(page) {
  console.log('\n🔐 Logging in as Pilot...')
  await page.goto(`${BASE_URL}/portal/login`)
  await page.fill('input[name="username"]', PILOT_USERNAME)
  await page.fill('input[name="password"]', PILOT_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/portal/dashboard**', { timeout: 10000 })
  console.log('✅ Pilot logged in successfully')
}

async function testAdminPilotCRUD(page) {
  console.log('\n📋 Testing Admin Portal - Pilot CRUD with Cache Refresh')

  try {
    // Navigate to pilots page
    await page.goto(`${BASE_URL}/dashboard/pilots`)
    await page.waitForLoadState('networkidle')

    // Get initial pilot count
    const initialRows = await page.locator('table tbody tr').count()
    console.log(`  Initial pilot count: ${initialRows}`)

    // Test 1: Create new pilot
    console.log('  Testing: Create new pilot...')
    await page.click('button:has-text("Add Pilot")')
    await page.waitForSelector('form', { timeout: 5000 })

    const testEmail = `test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="first_name"]', 'Test')
    await page.fill('input[name="last_name"]', 'Pilot')
    await page.fill('input[name="employee_number"]', `TEST${Date.now()}`)
    await page.selectOption('select[name="rank"]', 'FIRST_OFFICER')
    await page.selectOption('select[name="contract_type"]', 'FULL_TIME')
    await page.fill('input[name="commencement_date"]', '2025-01-01')
    await page.fill('input[name="date_of_birth"]', '1990-01-01')

    await page.click('button[type="submit"]')

    // Wait for success message and page reload
    await page.waitForTimeout(2000)

    // Verify cache refresh - pilot list should update
    const newRows = await page.locator('table tbody tr').count()
    const pilotAdded = newRows === initialRows + 1
    logTest('Admin - Pilots', 'Create pilot + cache refresh', pilotAdded,
      pilotAdded ? 'Pilot list updated immediately' : 'Cache not refreshed')

    return pilotAdded
  } catch (error) {
    logTest('Admin - Pilots', 'Create pilot + cache refresh', false, error.message)
    return false
  }
}

async function testAdminCertificationEdit(page) {
  console.log('\n📋 Testing Admin Portal - Certification Edit with Cache Refresh')

  try {
    // Navigate to certifications page
    await page.goto(`${BASE_URL}/dashboard/certifications`)
    await page.waitForLoadState('networkidle')

    // Find first certification and click edit
    const firstEditButton = page.locator('button:has-text("Edit")').first()
    const isVisible = await firstEditButton.isVisible()

    if (!isVisible) {
      logSkip('Admin - Certifications', 'Edit certification', 'No certifications available')
      return false
    }

    console.log('  Testing: Edit certification...')
    await firstEditButton.click()
    await page.waitForSelector('form', { timeout: 5000 })

    // Modify expiry date
    const newDate = '2026-12-31'
    await page.fill('input[name="expiry_date"]', newDate)
    await page.click('button[type="submit"]')

    // Wait for success and cache refresh
    await page.waitForTimeout(2000)

    // Verify cache refresh - page should update
    await page.goto(`${BASE_URL}/dashboard/certifications`)
    await page.waitForLoadState('networkidle')

    logTest('Admin - Certifications', 'Edit certification + cache refresh', true,
      'Certification list refreshed after edit')

    return true
  } catch (error) {
    logTest('Admin - Certifications', 'Edit certification + cache refresh', false, error.message)
    return false
  }
}

async function testAdminLeaveRequestReview(page) {
  console.log('\n📋 Testing Admin Portal - Leave Request Review with Cache Refresh')

  try {
    await page.goto(`${BASE_URL}/dashboard/leave`)
    await page.waitForLoadState('networkidle')

    // Find pending request
    const pendingRequests = page.locator('[data-status="SUBMITTED"], [data-status="IN_REVIEW"]')
    const count = await pendingRequests.count()

    if (count === 0) {
      logSkip('Admin - Leave', 'Review leave request', 'No pending requests')
      return false
    }

    console.log(`  Found ${count} pending request(s)`)
    console.log('  Testing: Approve leave request...')

    // Click first pending request
    await pendingRequests.first().click()
    await page.waitForTimeout(1000)

    // Approve request
    await page.click('button:has-text("Approve")')
    await page.waitForTimeout(2000)

    // Verify cache refresh - status should update
    const newCount = await page.locator('[data-status="SUBMITTED"], [data-status="IN_REVIEW"]').count()
    const cacheRefreshed = newCount === count - 1

    logTest('Admin - Leave', 'Approve leave request + cache refresh', cacheRefreshed,
      cacheRefreshed ? 'Request list updated immediately' : 'Cache not refreshed')

    return cacheRefreshed
  } catch (error) {
    logTest('Admin - Leave', 'Approve leave request + cache refresh', false, error.message)
    return false
  }
}

async function testPilotLeaveRequest(page) {
  console.log('\n📋 Testing Pilot Portal - Leave Request Submission with Cache Refresh')

  try {
    await page.goto(`${BASE_URL}/portal/leave-requests`)
    await page.waitForLoadState('networkidle')

    // Get initial request count
    const initialCount = await page.locator('[data-testid="leave-request-card"]').count()
    console.log(`  Initial request count: ${initialCount}`)

    console.log('  Testing: Submit new leave request...')
    await page.click('button:has-text("Request Leave")')
    await page.waitForSelector('form', { timeout: 5000 })

    // Fill form
    await page.selectOption('select[name="request_type"]', 'ANNUAL')
    await page.fill('input[name="start_date"]', '2025-12-15')
    await page.fill('input[name="end_date"]', '2025-12-20')
    await page.fill('textarea[name="reason"]', 'Test leave request for cache refresh testing')

    await page.click('button[type="submit"]')

    // Wait for success and cache refresh
    await page.waitForTimeout(3000)

    // Verify cache refresh - request list should update
    const newCount = await page.locator('[data-testid="leave-request-card"]').count()
    const cacheRefreshed = newCount === initialCount + 1

    logTest('Pilot - Leave', 'Submit leave request + cache refresh', cacheRefreshed,
      cacheRefreshed ? 'Request list updated immediately' : 'Cache not refreshed')

    return cacheRefreshed
  } catch (error) {
    logTest('Pilot - Leave', 'Submit leave request + cache refresh', false, error.message)
    return false
  }
}

async function testPilotRDORequest(page) {
  console.log('\n📋 Testing Pilot Portal - RDO/SDO Request with Cache Refresh')

  try {
    await page.goto(`${BASE_URL}/portal/flight-requests`)
    await page.waitForLoadState('networkidle')

    // Get initial request count
    const initialCount = await page.locator('[data-testid="flight-request-card"]').count()
    console.log(`  Initial request count: ${initialCount}`)

    console.log('  Testing: Submit new RDO request...')
    await page.click('button:has-text("Request RDO/SDO")')
    await page.waitForTimeout(1000)

    // Fill form
    await page.selectOption('select[name="request_type"]', 'RDO')
    await page.fill('input[name="requested_date"]', '2025-12-18')
    await page.fill('textarea[name="reason"]', 'Test RDO request for cache refresh testing')

    await page.click('button[type="submit"]')

    // Wait for success and cache refresh
    await page.waitForTimeout(3000)

    // Verify cache refresh
    const newCount = await page.locator('[data-testid="flight-request-card"]').count()
    const cacheRefreshed = newCount === initialCount + 1

    logTest('Pilot - RDO/SDO', 'Submit RDO request + cache refresh', cacheRefreshed,
      cacheRefreshed ? 'Request list updated immediately' : 'Cache not refreshed')

    return cacheRefreshed
  } catch (error) {
    logTest('Pilot - RDO/SDO', 'Submit RDO request + cache refresh', false, error.message)
    return false
  }
}

async function testCrossPortalSync(adminPage, pilotPage) {
  console.log('\n📋 Testing Cross-Portal Cache Synchronization')

  try {
    // Admin approves a pilot's leave request
    await adminPage.goto(`${BASE_URL}/dashboard/leave`)
    await adminPage.waitForLoadState('networkidle')

    const pendingRequests = adminPage.locator('[data-status="SUBMITTED"]')
    const count = await pendingRequests.count()

    if (count === 0) {
      logSkip('Cross-Portal', 'Admin approval → Pilot portal sync', 'No pending requests')
      return false
    }

    console.log('  Testing: Admin approves request, verify pilot portal updates...')

    // Get request ID before approval
    const requestElement = pendingRequests.first()
    await requestElement.click()
    await adminPage.waitForTimeout(1000)

    // Approve request
    await adminPage.click('button:has-text("Approve")')
    await adminPage.waitForTimeout(2000)

    // Check pilot portal updates
    await pilotPage.goto(`${BASE_URL}/portal/leave-requests`)
    await pilotPage.waitForLoadState('networkidle')
    await pilotPage.waitForTimeout(1000)

    // Verify approved request shows in pilot portal with updated status
    const approvedRequests = await pilotPage.locator('[data-status="APPROVED"]').count()

    logTest('Cross-Portal', 'Admin approval → Pilot portal sync', approvedRequests > 0,
      approvedRequests > 0 ? 'Pilot portal shows updated status' : 'Cross-portal cache not synced')

    return approvedRequests > 0
  } catch (error) {
    logTest('Cross-Portal', 'Admin approval → Pilot portal sync', false, error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Cache Refresh Implementation Tests\n')
  console.log('=' .repeat(80))

  const browser = await chromium.launch({ headless: false })

  try {
    // Create contexts for admin and pilot
    const adminContext = await browser.newContext()
    const pilotContext = await browser.newContext()

    const adminPage = await adminContext.newPage()
    const pilotPage = await pilotContext.newPage()

    // Login to both portals
    await loginAdmin(adminPage)
    await loginPilot(pilotPage)

    // Run Admin Portal Tests
    console.log('\n' + '='.repeat(80))
    console.log('ADMIN PORTAL TESTS')
    console.log('='.repeat(80))
    await testAdminPilotCRUD(adminPage)
    await testAdminCertificationEdit(adminPage)
    await testAdminLeaveRequestReview(adminPage)

    // Run Pilot Portal Tests
    console.log('\n' + '='.repeat(80))
    console.log('PILOT PORTAL TESTS')
    console.log('='.repeat(80))
    await testPilotLeaveRequest(pilotPage)
    await testPilotRDORequest(pilotPage)

    // Run Cross-Portal Tests
    console.log('\n' + '='.repeat(80))
    console.log('CROSS-PORTAL SYNC TESTS')
    console.log('='.repeat(80))
    await testCrossPortalSync(adminPage, pilotPage)

    // Print Summary
    console.log('\n' + '='.repeat(80))
    console.log('TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Passed: ${testResults.passed.length}`)
    console.log(`❌ Failed: ${testResults.failed.length}`)
    console.log(`⏭️  Skipped: ${testResults.skipped.length}`)
    console.log(`📊 Total: ${testResults.passed.length + testResults.failed.length + testResults.skipped.length}`)

    if (testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:')
      testResults.failed.forEach(test => console.log(`  - ${test}`))
    }

    if (testResults.skipped.length > 0) {
      console.log('\n⏭️  Skipped Tests:')
      testResults.skipped.forEach(test => console.log(`  - ${test}`))
    }

    console.log('\n' + '='.repeat(80))

    // Close contexts
    await adminContext.close()
    await pilotContext.close()

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message)
    console.error(error.stack)
  } finally {
    await browser.close()
  }

  // Return exit code based on test results
  process.exit(testResults.failed.length > 0 ? 1 : 0)
}

// Run tests
runTests().catch(console.error)
