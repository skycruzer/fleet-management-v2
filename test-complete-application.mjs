/**
 * COMPREHENSIVE APPLICATION TEST
 * Tests all pages, forms, and buttons from landing page through both portals
 */

import puppeteer from 'puppeteer'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ADMIN_CREDENTIALS: {
    email: 'skycruzer@icloud.com',
    password: 'mron2393'
  },
  PILOT_CREDENTIALS: {
    email: 'mrondeau@airniugini.com.pg',
    password: 'Lemakot@1972'
  }
}

const testResults = {
  passed: [],
  failed: [],
  warnings: []
}

function logTest(category, test, status, detail = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  const detailStr = detail ? ': ' + detail : ''
  const message = `${emoji} [${category}] ${test}${detailStr}`
  console.log(message)

  if (status === 'pass') testResults.passed.push(message)
  else if (status === 'fail') testResults.failed.push(message)
  else testResults.warnings.push(message)
}

console.log('\n' + '='.repeat(100))
console.log('  🧪 COMPREHENSIVE APPLICATION TEST - ALL PAGES, FORMS & BUTTONS')
console.log('='.repeat(100) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 50,
  args: ['--start-maximized']
})

const page = await browser.newPage()

// Capture console errors
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log(`🔴 [BROWSER ERROR] ${msg.text()}`)
  }
})

page.on('pageerror', error => {
  console.log(`🔴 [PAGE ERROR] ${error.message}`)
})

try {
  // ============================================================================
  // PHASE 1: LANDING PAGE & PUBLIC ROUTES
  // ============================================================================
  console.log('\n📍 PHASE 1: LANDING PAGE & PUBLIC ROUTES')
  console.log('─'.repeat(100))

  await page.goto(CONFIG.BASE_URL, { waitUntil: 'networkidle2' })
  await sleep(1000)

  // Test landing page elements
  const landingTitle = await page.$('h1')
  logTest('Landing Page', 'Title exists', landingTitle ? 'pass' : 'fail')

  const adminLoginLink = await page.$$eval('a', links =>
    links.find(a => a.textContent.includes('Admin Login') || a.href.includes('/auth/login'))
  )
  logTest('Landing Page', 'Admin Login link', adminLoginLink ? 'pass' : 'fail')

  const pilotPortalLink = await page.$$eval('a', links =>
    links.find(a => a.textContent.includes('Pilot Portal') || a.href.includes('/portal'))
  )
  logTest('Landing Page', 'Pilot Portal link', pilotPortalLink ? 'pass' : 'fail')

  await sleep(1000)

  // ============================================================================
  // PHASE 2: ADMIN AUTHENTICATION
  // ============================================================================
  console.log('\n📍 PHASE 2: ADMIN AUTHENTICATION')
  console.log('─'.repeat(100))

  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  // Test login form elements
  const emailInput = await page.$('input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')
  const loginButton = await page.$('button[type="submit"]')

  logTest('Admin Login', 'Email input exists', emailInput ? 'pass' : 'fail')
  logTest('Admin Login', 'Password input exists', passwordInput ? 'pass' : 'fail')
  logTest('Admin Login', 'Submit button exists', loginButton ? 'pass' : 'fail')

  // Perform login
  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 30 })
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 30 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
  await sleep(2000)

  const isOnDashboard = page.url().includes('/dashboard')
  logTest('Admin Login', 'Login successful', isOnDashboard ? 'pass' : 'fail', page.url())

  // ============================================================================
  // PHASE 3: ADMIN DASHBOARD NAVIGATION
  // ============================================================================
  console.log('\n📍 PHASE 3: ADMIN DASHBOARD NAVIGATION')
  console.log('─'.repeat(100))

  const dashboardPages = [
    { name: 'Dashboard Home', url: '/dashboard', elements: ['Dashboard', 'Overview'] },
    { name: 'Pilots List', url: '/dashboard/pilots', elements: ['Pilots', 'Add Pilot'] },
    { name: 'Certifications', url: '/dashboard/certifications', elements: ['Certifications', 'Add Certification'] },
    { name: 'Leave Requests', url: '/dashboard/leave', elements: ['Leave Requests', 'Submit Leave Request'] },
    { name: 'Renewal Planning', url: '/dashboard/renewal-planning', elements: ['Renewal Planning', '2025'] },
    { name: 'Analytics', url: '/dashboard/analytics', elements: ['Analytics', 'Fleet'] },
  ]

  for (const dashPage of dashboardPages) {
    await page.goto(`${CONFIG.BASE_URL}${dashPage.url}`, { waitUntil: 'networkidle2' })
    await sleep(1500)

    const pageLoaded = page.url().includes(dashPage.url)
    logTest('Admin Navigation', `${dashPage.name} loads`, pageLoaded ? 'pass' : 'fail')

    // Check for key elements
    for (const element of dashPage.elements) {
      const hasElement = await page.evaluate((text) => {
        return document.body.textContent.includes(text)
      }, element)

      if (hasElement) {
        logTest('Admin Page Content', `${dashPage.name} - "${element}" found`, 'pass')
      } else {
        logTest('Admin Page Content', `${dashPage.name} - "${element}" missing`, 'warn')
      }
    }
  }

  // ============================================================================
  // PHASE 4: ADMIN FORMS & BUTTONS
  // ============================================================================
  console.log('\n📍 PHASE 4: ADMIN FORMS & BUTTONS')
  console.log('─'.repeat(100))

  // Test: Add Pilot Button
  await page.goto(`${CONFIG.BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  const addPilotButton = await page.$$eval('button, a', elements => {
    return elements.some(el => el.textContent && el.textContent.includes('Add Pilot'))
  })
  logTest('Admin Buttons', 'Add Pilot button exists', addPilotButton ? 'pass' : 'fail')

  // Test: Submit Leave Request Button
  await page.goto(`${CONFIG.BASE_URL}/dashboard/leave`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  const submitLeaveButton = await page.$$eval('button, a', elements => {
    return elements.some(el => el.textContent && el.textContent.includes('Submit Leave Request'))
  })
  logTest('Admin Buttons', 'Submit Leave Request button exists', submitLeaveButton ? 'pass' : 'fail')

  if (submitLeaveButton) {
    // Click to test navigation
    await page.$$eval('button, a', elements => {
      const btn = elements.find(el => el.textContent && el.textContent.includes('Submit Leave Request'))
      if (btn) btn.click()
    })
    await sleep(2000)

    const onFormPage = page.url().includes('/dashboard/leave/new')
    logTest('Admin Navigation', 'Submit Leave Request navigates to form', onFormPage ? 'pass' : 'fail')

    if (onFormPage) {
      const formExists = await page.$('form')
      const pilotSelect = await page.$('select#pilot_id')
      const submitBtn = await page.$('button[type="submit"]')

      logTest('Leave Form', 'Form element exists', formExists ? 'pass' : 'fail')
      logTest('Leave Form', 'Pilot select exists', pilotSelect ? 'pass' : 'fail')
      logTest('Leave Form', 'Submit button exists', submitBtn ? 'pass' : 'fail')
    }
  }

  // Test: Add Certification Button
  await page.goto(`${CONFIG.BASE_URL}/dashboard/certifications`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  const addCertButton = await page.$$eval('button, a', elements => {
    return elements.some(el => el.textContent && el.textContent.includes('Add Certification'))
  })
  logTest('Admin Buttons', 'Add Certification button exists', addCertButton ? 'pass' : 'fail')

  // Test: Renewal Planning Year Navigation
  await page.goto(`${CONFIG.BASE_URL}/dashboard/renewal-planning`, { waitUntil: 'networkidle2' })
  await sleep(2000)

  const yearButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return {
      previousYear: buttons.some(btn => btn.textContent.includes('Previous Year')),
      nextYear: buttons.some(btn => btn.textContent.includes('Next Year'))
    }
  })

  logTest('Renewal Planning', 'Previous Year button exists', yearButtons.previousYear ? 'pass' : 'warn')
  logTest('Renewal Planning', 'Next Year button exists', yearButtons.nextYear ? 'pass' : 'warn')

  // ============================================================================
  // PHASE 5: ADMIN LOGOUT & PILOT PORTAL LOGIN
  // ============================================================================
  console.log('\n📍 PHASE 5: PILOT PORTAL AUTHENTICATION')
  console.log('─'.repeat(100))

  // Logout from admin
  await page.goto(`${CONFIG.BASE_URL}/auth/logout`, { waitUntil: 'networkidle2' })
  await sleep(2000)

  // Navigate to pilot portal login
  await page.goto(`${CONFIG.BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  // Test pilot login form
  const pilotEmailInput = await page.$('input[type="email"]')
  const pilotPasswordInput = await page.$('input[type="password"]')
  const pilotLoginButton = await page.$('button[type="submit"]')

  logTest('Pilot Login', 'Email input exists', pilotEmailInput ? 'pass' : 'fail')
  logTest('Pilot Login', 'Password input exists', pilotPasswordInput ? 'pass' : 'fail')
  logTest('Pilot Login', 'Submit button exists', pilotLoginButton ? 'pass' : 'fail')

  // Perform pilot login
  await page.type('input[type="email"]', CONFIG.PILOT_CREDENTIALS.email, { delay: 30 })
  await page.type('input[type="password"]', CONFIG.PILOT_CREDENTIALS.password, { delay: 30 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
  await sleep(3000)

  const isOnPortalDashboard = page.url().includes('/portal/dashboard')
  logTest('Pilot Login', 'Login successful', isOnPortalDashboard ? 'pass' : 'fail', page.url())

  // ============================================================================
  // PHASE 6: PILOT PORTAL NAVIGATION
  // ============================================================================
  console.log('\n📍 PHASE 6: PILOT PORTAL NAVIGATION')
  console.log('─'.repeat(100))

  const portalPages = [
    { name: 'Portal Dashboard', url: '/portal/dashboard', elements: ['Dashboard', 'Welcome'] },
    { name: 'My Profile', url: '/portal/profile', elements: ['Profile', 'Personal Information'] },
    { name: 'My Certifications', url: '/portal/certifications', elements: ['Certifications', 'Check Type'] },
    { name: 'Leave Requests', url: '/portal/leave-requests', elements: ['Leave Requests', 'New Request'] },
    { name: 'Flight Requests', url: '/portal/flight-requests', elements: ['Flight Requests', 'New Request'] },
    { name: 'Notifications', url: '/portal/notifications', elements: ['Notifications'] },
  ]

  for (const portalPage of portalPages) {
    await page.goto(`${CONFIG.BASE_URL}${portalPage.url}`, { waitUntil: 'networkidle2' })
    await sleep(1500)

    const pageLoaded = page.url().includes(portalPage.url)
    logTest('Pilot Navigation', `${portalPage.name} loads`, pageLoaded ? 'pass' : 'fail')

    // Check for key elements
    for (const element of portalPage.elements) {
      const hasElement = await page.evaluate((text) => {
        return document.body.textContent.includes(text)
      }, element)

      if (hasElement) {
        logTest('Pilot Page Content', `${portalPage.name} - "${element}" found`, 'pass')
      } else {
        logTest('Pilot Page Content', `${portalPage.name} - "${element}" missing`, 'warn')
      }
    }
  }

  // ============================================================================
  // PHASE 7: PILOT PORTAL FORMS & BUTTONS
  // ============================================================================
  console.log('\n📍 PHASE 7: PILOT PORTAL FORMS & BUTTONS')
  console.log('─'.repeat(100))

  // Test: Notification Bell
  await page.goto(`${CONFIG.BASE_URL}/portal/dashboard`, { waitUntil: 'networkidle2' })
  await sleep(2000)

  const notificationBell = await page.$('button svg[class*="lucide-bell"]')
  logTest('Pilot Portal UI', 'Notification bell exists', notificationBell ? 'pass' : 'fail')

  if (notificationBell) {
    const bellButton = await page.$('button:has(svg[class*="lucide-bell"])')
    if (bellButton) {
      await bellButton.click()
      await sleep(1500)

      const popoverOpen = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"], [data-radix-popper-content-wrapper]')
      })

      logTest('Pilot Portal UI', 'Notification dropdown opens', popoverOpen ? 'pass' : 'warn')
    }
  }

  // Test: Leave Request Form
  await page.goto(`${CONFIG.BASE_URL}/portal/leave-requests`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  const newLeaveButton = await page.$$eval('button, a', elements => {
    return elements.some(el => el.textContent && el.textContent.includes('New Request'))
  })
  logTest('Pilot Buttons', 'New Leave Request button exists', newLeaveButton ? 'pass' : 'fail')

  if (newLeaveButton) {
    await page.$$eval('button, a', elements => {
      const btn = elements.find(el => el.textContent && el.textContent.includes('New Request'))
      if (btn) btn.click()
    })
    await sleep(2000)

    const onLeaveForm = page.url().includes('/portal/leave-requests/new')
    logTest('Pilot Navigation', 'New Leave Request navigates to form', onLeaveForm ? 'pass' : 'fail')

    if (onLeaveForm) {
      const formExists = await page.$('form')
      const leaveTypeSelect = await page.$('select')
      const submitBtn = await page.$('button[type="submit"]')

      logTest('Leave Request Form', 'Form element exists', formExists ? 'pass' : 'fail')
      logTest('Leave Request Form', 'Leave type select exists', leaveTypeSelect ? 'pass' : 'fail')
      logTest('Leave Request Form', 'Submit button exists', submitBtn ? 'pass' : 'fail')
    }
  }

  // Test: Flight Request Form
  await page.goto(`${CONFIG.BASE_URL}/portal/flight-requests`, { waitUntil: 'networkidle2' })
  await sleep(1500)

  const newFlightButton = await page.$$eval('button, a', elements => {
    return elements.some(el => el.textContent && el.textContent.includes('New Request'))
  })
  logTest('Pilot Buttons', 'New Flight Request button exists', newFlightButton ? 'pass' : 'fail')

  if (newFlightButton) {
    await page.$$eval('button, a', elements => {
      const btn = elements.find(el => el.textContent && el.textContent.includes('New Request'))
      if (btn) btn.click()
    })
    await sleep(2000)

    const onFlightForm = page.url().includes('/portal/flight-requests/new')
    logTest('Pilot Navigation', 'New Flight Request navigates to form', onFlightForm ? 'pass' : 'fail')

    if (onFlightForm) {
      const formExists = await page.$('form')
      const requestTypeSelect = await page.$('select')
      const descriptionTextarea = await page.$('textarea')
      const submitBtn = await page.$('button[type="submit"]')

      logTest('Flight Request Form', 'Form element exists', formExists ? 'pass' : 'fail')
      logTest('Flight Request Form', 'Request type select exists', requestTypeSelect ? 'pass' : 'fail')
      logTest('Flight Request Form', 'Description textarea exists', descriptionTextarea ? 'pass' : 'fail')
      logTest('Flight Request Form', 'Submit button exists', submitBtn ? 'pass' : 'fail')
    }
  }

  // Test: Notification Actions
  await page.goto(`${CONFIG.BASE_URL}/portal/notifications`, { waitUntil: 'networkidle2' })
  await sleep(2000)

  const markAllButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.some(btn => btn.textContent.includes('Mark All as Read'))
  })
  logTest('Notification Page', 'Mark All as Read button exists', markAllButton ? 'pass' : 'warn')

  // ============================================================================
  // PHASE 8: TEST RESULTS SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(100))
  console.log('  📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(100))

  console.log(`\n✅ Passed: ${testResults.passed.length}`)
  console.log(`❌ Failed: ${testResults.failed.length}`)
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`)

  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(1)

  console.log(`\n📈 Pass Rate: ${passRate}%`)

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:')
    testResults.failed.forEach(test => console.log('   ' + test))
  }

  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    testResults.warnings.forEach(test => console.log('   ' + test))
  }

  console.log('\n' + '='.repeat(100))
  console.log('  🎯 TESTING COMPLETE')
  console.log('='.repeat(100))
  console.log('\n💡 Browser will stay open for manual inspection.')
  console.log('   Close the browser window when done.\n')

  // Keep browser open for inspection
  await new Promise(() => {})

} catch (error) {
  console.error('\n❌ CRITICAL TEST ERROR:', error.message)
  console.error(error.stack)

  console.log('\n💡 Browser will stay open for debugging.')
  await new Promise(() => {})
}
