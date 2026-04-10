/**
 * Comprehensive Form Testing Script
 * Tests ALL forms and buttons in Admin and Pilot Portals
 */

const puppeteer = require('puppeteer')

// Credentials
const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'
const PILOT_EMAIL = 'mrondeau@airniugini.com.pg'
const PILOT_PASSWORD = 'Lemakot@1972'

const BASE_URL = 'http://localhost:3000'

// Test results tracking
const testResults = {
  adminForms: [],
  pilotForms: [],
  totalTests: 0,
  passed: 0,
  failed: 0,
}

function logTest(portal, formName, action, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  const result = { portal, formName, action, status, details }

  if (portal === 'admin') {
    testResults.adminForms.push(result)
  } else {
    testResults.pilotForms.push(result)
  }

  testResults.totalTests++
  if (status === 'PASS') testResults.passed++
  if (status === 'FAIL') testResults.failed++

  console.log(
    `${emoji} [${portal.toUpperCase()}] ${formName} - ${action}: ${status}${details ? ' - ' + details : ''}`
  )
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function screenshot(page, name) {
  await page.screenshot({
    path: `test-results/form-test-${name}.png`,
    fullPage: true,
  })
}

async function loginAsAdmin(page) {
  console.log('\n🔐 Logging in as Admin...')
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle0' })
  await wait(1000)

  await page.type('#email', ADMIN_EMAIL)
  await page.type('#password', ADMIN_PASSWORD)
  await screenshot(page, 'admin-login')

  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
  await wait(1000)

  console.log('✅ Admin logged in\n')
}

async function loginAsPilot(page) {
  console.log('\n🔐 Logging in as Pilot...')
  await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle0' })
  await wait(1000)

  await page.type('#email', PILOT_EMAIL)
  await page.type('#password', PILOT_PASSWORD)
  await screenshot(page, 'pilot-login')

  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
  await wait(1000)

  console.log('✅ Pilot logged in\n')
}

async function testButton(page, portal, formName, buttonSelector, buttonName) {
  try {
    const button = await page.$(buttonSelector)
    if (button) {
      const isVisible = await button.isIntersectingViewport()
      const isEnabled = await page.evaluate((btn) => !btn.disabled, button)

      if (isVisible && isEnabled) {
        logTest(portal, formName, `Button: ${buttonName}`, 'PASS', 'Visible and enabled')
        return true
      } else if (!isEnabled) {
        logTest(portal, formName, `Button: ${buttonName}`, 'WARN', 'Disabled')
        return false
      } else {
        logTest(portal, formName, `Button: ${buttonName}`, 'WARN', 'Not visible')
        return false
      }
    } else {
      logTest(portal, formName, `Button: ${buttonName}`, 'FAIL', 'Not found')
      return false
    }
  } catch (error) {
    logTest(portal, formName, `Button: ${buttonName}`, 'FAIL', error.message)
    return false
  }
}

async function testAdminForms(page) {
  console.log('\n' + '='.repeat(80))
  console.log('🏢 TESTING ADMIN PORTAL FORMS')
  console.log('='.repeat(80) + '\n')

  // Test 1: Pilot List - Add Pilot Button
  console.log('📋 Test 1: Pilot List Page...')
  await page.goto(`${BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-pilots-list')
  await testButton(page, 'admin', 'Pilot List', 'a[href="/dashboard/pilots/new"]', 'Add Pilot')
  await wait(500)

  // Test 2: Add Pilot Form
  console.log('\n📋 Test 2: Add Pilot Form...')
  const addPilotBtn = await page.$('a[href="/dashboard/pilots/new"]')
  if (addPilotBtn) {
    await addPilotBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(1000)
    await screenshot(page, 'admin-add-pilot-form')

    // Check form fields
    const hasEmployeeId = await page.$('#employee_id')
    const hasRole = await page.$('#role')
    const hasFirstName = await page.$('#first_name')
    const hasLastName = await page.$('#last_name')

    if (hasEmployeeId && hasRole && hasFirstName && hasLastName) {
      logTest('admin', 'Add Pilot Form', 'Form fields', 'PASS', 'All required fields present')
    } else {
      logTest('admin', 'Add Pilot Form', 'Form fields', 'FAIL', 'Missing required fields')
    }

    await testButton(page, 'admin', 'Add Pilot Form', 'button[type="submit"]', 'Create Pilot')
    await testButton(page, 'admin', 'Add Pilot Form', 'a[href="/dashboard/pilots"]', 'Cancel')
  }

  // Test 3: Edit Pilot Form
  console.log('\n📋 Test 3: Edit Pilot Form...')
  await page.goto(`${BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle0' })
  await wait(1000)

  const editButton = await page.$('a[href*="/dashboard/pilots/"][href*="/edit"]')
  if (editButton) {
    await editButton.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(1000)
    await screenshot(page, 'admin-edit-pilot-form')

    // Test rank dropdown is working
    const rankDropdown = await page.$('#role')
    if (rankDropdown) {
      const currentValue = await page.evaluate((el) => el.value, rankDropdown)
      logTest('admin', 'Edit Pilot Form', 'Rank dropdown', 'PASS', `Current: ${currentValue}`)
    } else {
      logTest('admin', 'Edit Pilot Form', 'Rank dropdown', 'FAIL', 'Not found')
    }

    await testButton(page, 'admin', 'Edit Pilot Form', 'button[type="submit"]', 'Save Changes')
    await testButton(page, 'admin', 'Edit Pilot Form', 'a[href*="/dashboard/pilots/"]', 'Cancel')
  }

  // Test 4: Certifications List
  console.log('\n📋 Test 4: Certifications List...')
  await page.goto(`${BASE_URL}/dashboard/certifications`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-certifications-list')
  await testButton(
    page,
    'admin',
    'Certifications List',
    'a[href="/dashboard/certifications/new"]',
    'Add Certification'
  )

  // Test 5: Edit Certification Form
  console.log('\n📋 Test 5: Edit Certification Form...')
  const editCertBtn = await page.$('a[href*="/dashboard/certifications/"][href*="/edit"]')
  if (editCertBtn) {
    await editCertBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(1000)
    await screenshot(page, 'admin-edit-certification-form')

    // Test expiry date field
    const expiryDateField = await page.$('#expiry_date')
    if (expiryDateField) {
      const dateValue = await page.evaluate((el) => el.value, expiryDateField)
      logTest(
        'admin',
        'Edit Certification Form',
        'Expiry date field',
        'PASS',
        `Value: ${dateValue}`
      )
    } else {
      logTest('admin', 'Edit Certification Form', 'Expiry date field', 'FAIL', 'Not found')
    }

    await testButton(
      page,
      'admin',
      'Edit Certification Form',
      'button[type="submit"]',
      'Save Changes'
    )
    await testButton(
      page,
      'admin',
      'Edit Certification Form',
      'a[href="/dashboard/certifications"]',
      'Cancel'
    )
  }

  // Test 6: Leave Requests Page
  console.log('\n📋 Test 6: Leave Requests Management...')
  await page.goto(`${BASE_URL}/dashboard/leave-requests`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-leave-requests')
  await testButton(
    page,
    'admin',
    'Leave Requests',
    'button:has-text("Submit Leave Request")',
    'Submit Leave Request'
  )

  // Test 7: Flight Requests Page
  console.log('\n📋 Test 7: Flight Requests Management...')
  await page.goto(`${BASE_URL}/dashboard/flight-requests`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-flight-requests')

  const flightRequestBtn = await page.$('button:has-text("New Flight Request")')
  if (flightRequestBtn) {
    logTest('admin', 'Flight Requests', 'Button: New Flight Request', 'PASS', 'Found')
  } else {
    logTest(
      'admin',
      'Flight Requests',
      'Button: New Flight Request',
      'WARN',
      'Not found or different text'
    )
  }

  // Test 8: Leave Approval Page
  console.log('\n📋 Test 8: Leave Approval Dashboard...')
  await page.goto(`${BASE_URL}/dashboard/leave/approve`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-leave-approve')

  const hasApprovalDashboard = await page.$('h1:has-text("Leave Request Approval")')
  if (hasApprovalDashboard) {
    logTest('admin', 'Leave Approval', 'Page load', 'PASS', 'Dashboard loaded')
  } else {
    logTest('admin', 'Leave Approval', 'Page load', 'FAIL', 'Dashboard not found')
  }

  // Test 9: Feedback Admin Page
  console.log('\n📋 Test 9: Feedback Admin Dashboard...')
  await page.goto(`${BASE_URL}/dashboard/feedback`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'admin-feedback-dashboard')

  const hasFeedbackDashboard = await page.$('h1:has-text("Pilot Feedback Dashboard")')
  if (hasFeedbackDashboard) {
    logTest('admin', 'Feedback Admin', 'Page load', 'PASS', 'Dashboard loaded')
  } else {
    logTest('admin', 'Feedback Admin', 'Page load', 'FAIL', 'Dashboard not found')
  }

  console.log('\n✅ Admin Portal Forms Testing Complete!\n')
}

async function testPilotForms(page) {
  console.log('\n' + '='.repeat(80))
  console.log('👨‍✈️ TESTING PILOT PORTAL FORMS')
  console.log('='.repeat(80) + '\n')

  // Test 1: Pilot Dashboard
  console.log('📋 Test 1: Pilot Dashboard...')
  await page.goto(`${BASE_URL}/portal/dashboard`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-dashboard')

  const hasDashboard = await page.$('h1:has-text("Dashboard")')
  if (hasDashboard) {
    logTest('pilot', 'Dashboard', 'Page load', 'PASS', 'Dashboard loaded')
  } else {
    logTest('pilot', 'Dashboard', 'Page load', 'FAIL', 'Dashboard not found')
  }

  // Test 2: Leave Requests Page
  console.log('\n📋 Test 2: Leave Requests Page...')
  await page.goto(`${BASE_URL}/portal/leave-requests`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-leave-requests')
  await testButton(
    page,
    'pilot',
    'Leave Requests',
    'a[href="/portal/leave-requests/new"]',
    'Submit Leave Request'
  )

  // Test 3: Submit Leave Request Form
  console.log('\n📋 Test 3: Submit Leave Request Form...')
  const submitLeaveBtn = await page.$('a[href="/portal/leave-requests/new"]')
  if (submitLeaveBtn) {
    await submitLeaveBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(1000)
    await screenshot(page, 'pilot-submit-leave-request-form')

    // Check form fields
    const hasLeaveType = await page.$('select[name="leave_type"]')
    const hasStartDate = await page.$('input[name="start_date"]')
    const hasEndDate = await page.$('input[name="end_date"]')

    if (hasLeaveType && hasStartDate && hasEndDate) {
      logTest('pilot', 'Submit Leave Request', 'Form fields', 'PASS', 'All required fields present')
    } else {
      logTest('pilot', 'Submit Leave Request', 'Form fields', 'FAIL', 'Missing required fields')
    }

    await testButton(
      page,
      'pilot',
      'Submit Leave Request',
      'button[type="submit"]',
      'Submit Leave Request'
    )
    await testButton(
      page,
      'pilot',
      'Submit Leave Request',
      'a[href="/portal/leave-requests"]',
      'Cancel'
    )
  }

  // Test 4: Flight Requests Page
  console.log('\n📋 Test 4: Flight Requests Page...')
  await page.goto(`${BASE_URL}/portal/flight-requests`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-flight-requests')
  await testButton(
    page,
    'pilot',
    'Flight Requests',
    'a[href="/portal/flight-requests/new"]',
    'Submit Flight Request'
  )

  // Test 5: Submit Flight Request Form
  console.log('\n📋 Test 5: Submit Flight Request Form...')
  const submitFlightBtn = await page.$('a[href="/portal/flight-requests/new"]')
  if (submitFlightBtn) {
    await submitFlightBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(1000)
    await screenshot(page, 'pilot-submit-flight-request-form')

    await testButton(
      page,
      'pilot',
      'Submit Flight Request',
      'button[type="submit"]',
      'Submit Request'
    )
    await testButton(
      page,
      'pilot',
      'Submit Flight Request',
      'a[href="/portal/flight-requests"]',
      'Cancel'
    )
  }

  // Test 6: Feedback Page
  console.log('\n📋 Test 6: Feedback Form...')
  await page.goto(`${BASE_URL}/portal/feedback`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-feedback-form')

  // Check feedback form fields
  const hasFeedbackCategory = await page.$('select[name="category"]')
  const hasFeedbackMessage = await page.$('textarea[name="message"]')

  if (hasFeedbackCategory && hasFeedbackMessage) {
    logTest('pilot', 'Feedback Form', 'Form fields', 'PASS', 'All required fields present')
  } else {
    logTest('pilot', 'Feedback Form', 'Form fields', 'FAIL', 'Missing required fields')
  }

  await testButton(page, 'pilot', 'Feedback Form', 'button[type="submit"]', 'Submit Feedback')

  // Test 7: Leave Bids Page
  console.log('\n📋 Test 7: Leave Bids Page...')
  await page.goto(`${BASE_URL}/portal/leave-bids`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-leave-bids')
  await testButton(
    page,
    'pilot',
    'Leave Bids',
    'a[href="/portal/leave-bids/new"]',
    'Submit Leave Bid'
  )

  // Test 8: Profile Page
  console.log('\n📋 Test 8: Profile Page...')
  await page.goto(`${BASE_URL}/portal/profile`, { waitUntil: 'networkidle0' })
  await wait(1000)
  await screenshot(page, 'pilot-profile')

  const hasProfile = await page.$('h1:has-text("Profile")')
  if (hasProfile) {
    logTest('pilot', 'Profile', 'Page load', 'PASS', 'Profile loaded')
  } else {
    logTest('pilot', 'Profile', 'Page load', 'FAIL', 'Profile not found')
  }

  console.log('\n✅ Pilot Portal Forms Testing Complete!\n')
}

function printSummary() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80) + '\n')

  console.log(`Total Tests: ${testResults.totalTests}`)
  console.log(
    `✅ Passed: ${testResults.passed} (${Math.round((testResults.passed / testResults.totalTests) * 100)}%)`
  )
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.totalTests - testResults.passed - testResults.failed}`)

  console.log('\n📋 Admin Portal Results:')
  console.log(`   Tests: ${testResults.adminForms.length}`)
  console.log(`   Passed: ${testResults.adminForms.filter((t) => t.status === 'PASS').length}`)
  console.log(`   Failed: ${testResults.adminForms.filter((t) => t.status === 'FAIL').length}`)

  console.log('\n📋 Pilot Portal Results:')
  console.log(`   Tests: ${testResults.pilotForms.length}`)
  console.log(`   Passed: ${testResults.pilotForms.filter((t) => t.status === 'PASS').length}`)
  console.log(`   Failed: ${testResults.pilotForms.filter((t) => t.status === 'FAIL').length}`)

  console.log('\n' + '='.repeat(80))

  // Print failures
  const failures = [...testResults.adminForms, ...testResults.pilotForms].filter(
    (t) => t.status === 'FAIL'
  )
  if (failures.length > 0) {
    console.log('\n❌ FAILED TESTS:\n')
    failures.forEach((f) => {
      console.log(`   [${f.portal.toUpperCase()}] ${f.formName} - ${f.action}: ${f.details}`)
    })
  }

  console.log('\n✅ All screenshots saved to test-results/ directory\n')
}

async function runTests() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  try {
    // Test Admin Portal
    await loginAsAdmin(page)
    await testAdminForms(page)

    // Logout and test Pilot Portal
    await page.goto(`${BASE_URL}/auth/logout`, { waitUntil: 'networkidle0' })
    await wait(2000)

    await loginAsPilot(page)
    await testPilotForms(page)

    // Print summary
    printSummary()

    console.log('🎉 ALL FORM TESTING COMPLETED!\n')
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    await screenshot(page, 'error-final')
  } finally {
    console.log('⏱️  Keeping browser open for 10 seconds for review...')
    await wait(10000)
    await browser.close()
    console.log('✅ Browser closed\n')
  }
}

runTests()
