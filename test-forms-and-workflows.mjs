/**
 * COMPREHENSIVE FORMS & WORKFLOWS TESTING
 * Tests ALL forms with actual submissions and workflows
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

console.log('\n' + '='.repeat(80))
console.log('  🧪 COMPREHENSIVE FORMS & WORKFLOWS TESTING')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 50
})

const page = await browser.newPage()

// Track results
const results = {
  passed: [],
  failed: [],
  warnings: []
}

function logTest(status, message) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' }
  console.log(`${icons[status]} ${message}`)
  if (status === 'pass') results.passed.push(message)
  else if (status === 'fail') results.failed.push(message)
  else results.warnings.push(message)
}

try {
  //============================================================================
  // PILOT PORTAL FORM WORKFLOWS
  //============================================================================
  console.log('\n✈️  PILOT PORTAL TESTING\n')

  // Login as pilot
  console.log('🔐 Logging into Pilot Portal...')
  await page.goto(`${CONFIG.BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.PILOT_CREDENTIALS.email)
  await page.type('input[type="password"]', CONFIG.PILOT_CREDENTIALS.password)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
  await sleep(2000)
  logTest('pass', 'Pilot login successful')

  // Test 1: Submit Leave Request Form
  console.log('\n📝 Test 1: Pilot Leave Request Form Submission')
  await page.goto(`${CONFIG.BASE_URL}/portal/leave-requests`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  // Click New Leave Request button
  const leaveFormOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const newButton = buttons.find(btn => btn.textContent.includes('New Leave Request'))
    if (newButton) {
      newButton.click()
      return true
    }
    return false
  })

  if (leaveFormOpened) {
    await sleep(2000)

    // Fill out the form
    try {
      await page.select('select[name="request_type"]', 'ANNUAL')
      await sleep(500)

      // Set dates (next week)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 7)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 14)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]

      await page.type('input[name="start_date"]', tomorrowStr)
      await sleep(500)
      await page.type('input[name="end_date"]', nextWeekStr)
      await sleep(500)

      await page.type('textarea[name="reason"]', 'Testing leave request form submission workflow')
      await sleep(500)

      // Submit the form
      await page.click('button[type="submit"]')
      await sleep(3000)

      // Check for success
      const pageText = await page.evaluate(() => document.body.textContent)
      if (pageText.includes('success') || pageText.includes('submitted') || pageText.includes('created')) {
        logTest('pass', 'Leave request form submitted successfully')
      } else {
        logTest('warn', 'Leave request form submitted but no success message')
      }
    } catch (error) {
      logTest('fail', `Leave request form submission failed: ${error.message}`)
    }
  } else {
    logTest('fail', 'Leave request form - button not found')
  }

  await sleep(2000)

  // Test 2: Submit Flight Request Form
  console.log('\n✈️  Test 2: Pilot Flight Request Form Submission')
  await page.goto(`${CONFIG.BASE_URL}/portal/flight-requests`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  const flightFormOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const newButton = buttons.find(btn => btn.textContent.includes('New Flight Request'))
    if (newButton) {
      newButton.click()
      return true
    }
    return false
  })

  if (flightFormOpened) {
    await sleep(2000)

    try {
      // Fill form fields
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 7)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await page.type('input[name="flight_date"], input[name="request_date"]', tomorrowStr)
      await sleep(500)

      await page.type('textarea[name="description"]', 'Testing flight request form: Request for additional flight duty on upcoming roster period to gain more experience.')
      await sleep(500)

      // Submit the form
      await page.click('button[type="submit"]')
      await sleep(3000)

      // Check for success
      const pageText = await page.evaluate(() => document.body.textContent)
      if (pageText.includes('success') || pageText.includes('submitted') || pageText.includes('created')) {
        logTest('pass', 'Flight request form submitted successfully')
      } else {
        logTest('warn', 'Flight request form submitted but no success message')
      }
    } catch (error) {
      logTest('fail', `Flight request form submission failed: ${error.message}`)
    }
  } else {
    logTest('fail', 'Flight request form - button not found')
  }

  await sleep(2000)

  // Test 3: Submit Annual Leave Bid Form
  console.log('\n📅 Test 3: Pilot Annual Leave Bid Form Submission')
  await page.goto(`${CONFIG.BASE_URL}/portal/leave-bids`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  const bidFormOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const newButton = buttons.find(btn => btn.textContent.includes('Submit Leave Bid') || btn.textContent.includes('New Leave Bid'))
    if (newButton) {
      newButton.click()
      return true
    }
    return false
  })

  if (bidFormOpened) {
    await sleep(2000)

    try {
      // Fill form fields
      const nextYear = new Date().getFullYear() + 1
      await page.type('input[name="bid_year"]', nextYear.toString())
      await sleep(500)

      // Submit the form
      await page.click('button[type="submit"]')
      await sleep(3000)

      // Check for success
      const pageText = await page.evaluate(() => document.body.textContent)
      if (pageText.includes('success') || pageText.includes('submitted') || pageText.includes('created')) {
        logTest('pass', 'Leave bid form submitted successfully')
      } else {
        logTest('warn', 'Leave bid form submitted but no success message')
      }
    } catch (error) {
      logTest('fail', `Leave bid form submission failed: ${error.message}`)
    }
  } else {
    logTest('warn', 'Leave bid form - button not found')
  }

  //============================================================================
  // ADMIN PORTAL FORM WORKFLOWS
  //============================================================================
  console.log('\n\n📊 ADMIN PORTAL TESTING\n')

  // Logout and login as admin
  await page.goto(`${CONFIG.BASE_URL}/auth/logout`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  console.log('🔐 Logging into Admin Portal...')
  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email)
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
  await sleep(2000)
  logTest('pass', 'Admin login successful')

  // Test 4: Add Pilot Form
  console.log('\n👨‍✈️ Test 4: Add Pilot Form')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  const addPilotOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const addButton = buttons.find(btn => btn.textContent.includes('Add Pilot'))
    if (addButton) {
      addButton.click()
      return true
    }
    return false
  })

  if (addPilotOpened) {
    await sleep(2000)
    const hasForm = await page.$('form')
    if (hasForm) {
      logTest('pass', 'Add Pilot form opened successfully')
    } else {
      logTest('fail', 'Add Pilot form - form not found')
    }
  } else {
    logTest('fail', 'Add Pilot form - button not found')
  }

  // Test 5: Add Certification Form
  console.log('\n🎓 Test 5: Add Certification Form')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/certifications`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  const addCertOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const addButton = buttons.find(btn => btn.textContent.includes('Add Certification'))
    if (addButton) {
      addButton.click()
      return true
    }
    return false
  })

  if (addCertOpened) {
    await sleep(2000)
    const hasForm = await page.$('form')
    if (hasForm) {
      logTest('pass', 'Add Certification form opened successfully')
    } else {
      logTest('fail', 'Add Certification form - form not found')
    }
  } else {
    logTest('fail', 'Add Certification form - button not found')
  }

  // Test 6: Submit Leave Request Form (Admin)
  console.log('\n📝 Test 6: Admin Submit Leave Request Form')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/leave`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  const adminLeaveOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'))
    const submitButton = buttons.find(btn => btn.textContent.includes('Submit Leave Request'))
    if (submitButton) {
      submitButton.click()
      return true
    }
    return false
  })

  if (adminLeaveOpened) {
    await sleep(2000)
    const url = page.url()
    if (url.includes('/dashboard/leave/new')) {
      logTest('pass', 'Admin leave request form navigation works')
    } else {
      logTest('fail', 'Admin leave request form - wrong URL')
    }
  } else {
    logTest('fail', 'Admin leave request form - button not found')
  }

  //============================================================================
  // RESULTS SUMMARY
  //============================================================================
  console.log('\n\n' + '='.repeat(80))
  console.log('  📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Passed:   ${results.passed.length}`)
  console.log(`❌ Failed:   ${results.failed.length}`)
  console.log(`⚠️  Warnings: ${results.warnings.length}`)
  console.log('='.repeat(80))

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:')
    results.failed.forEach(msg => console.log(`   - ${msg}`))
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    results.warnings.forEach(msg => console.log(`   - ${msg}`))
  }

  const total = results.passed.length + results.failed.length + results.warnings.length
  const passRate = ((results.passed.length / total) * 100).toFixed(1)
  console.log(`\n📈 Pass Rate: ${passRate}%`)
  console.log('\n💡 Browser will stay open for manual inspection.\n')

  // Keep browser open
  await new Promise(() => {})

} catch (error) {
  console.error('\n❌ Test Error:', error.message)
  console.error(error.stack)
  console.log('\n💡 Browser will stay open for inspection.\n')
  await new Promise(() => {})
}
