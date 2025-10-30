/**
 * Test Admin Leave Request Submit Button
 */

import puppeteer from 'puppeteer'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ADMIN_CREDENTIALS: {
    email: 'skycruzer@icloud.com',
    password: 'mron2393'
  }
}

console.log('\n' + '='.repeat(80))
console.log('  🧪 TESTING ADMIN LEAVE REQUEST SUBMIT BUTTON')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 150
})

const page = await browser.newPage()

// Capture console logs and errors
page.on('console', (msg) => {
  const type = msg.type()
  const text = msg.text()
  if (type === 'error') {
    console.log(`❌ [BROWSER ERROR] ${text}`)
  } else if (text.includes('Form') || text.includes('Submit') || text.includes('API')) {
    console.log(`📝 [BROWSER LOG] ${text}`)
  }
})

page.on('pageerror', error => {
  console.log(`❌ [PAGE ERROR] ${error.message}`)
})

try {
  // Step 1: Login
  console.log('📝 Step 1: Logging into Admin Portal...')
  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ Logged in\n')

  // Step 2: Navigate to Leave Requests page
  console.log('📝 Step 2: Navigating to Leave Requests page...')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/leave`, { waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ On Leave Requests page\n')

  // Step 3: Click "Submit Leave Request" button
  console.log('📝 Step 3: Clicking "Submit Leave Request" button...')
  const submitButton = await page.$$eval('button, a', elements => {
    for (const el of elements) {
      if (el.textContent && el.textContent.includes('Submit Leave Request')) {
        el.click()
        return true
      }
    }
    return false
  })

  if (!submitButton) {
    console.log('❌ Submit Leave Request button not found!')
    throw new Error('Button not found')
  }

  await sleep(3000)
  console.log('✅ Button clicked\n')

  // Step 4: Check if we're on the form page
  console.log('📝 Step 4: Checking if form page loaded...')
  const currentURL = page.url()
  console.log(`📍 Current URL: ${currentURL}`)

  if (currentURL.includes('/dashboard/leave/new')) {
    console.log('✅ Form page loaded successfully!\n')

    // Check if form exists
    const formExists = await page.$('form')
    if (formExists) {
      console.log('✅ Form element found')

      // Check for pilot select
      const pilotSelect = await page.$('select#pilot_id')
      if (pilotSelect) {
        console.log('✅ Pilot select found')
      } else {
        console.log('❌ Pilot select NOT found')
      }

      // Check for submit button
      const formSubmitButton = await page.$$eval('button[type="submit"]', buttons => buttons.length)
      console.log(`✅ Found ${formSubmitButton} submit button(s)`)
    } else {
      console.log('❌ Form element NOT found')
    }
  } else {
    console.log(`❌ Expected /dashboard/leave/new but got ${currentURL}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('  🎯 TEST RESULTS')
  console.log('='.repeat(80))
  console.log(`Button Click:    ✅ SUCCESS`)
  console.log(`Page Navigation: ${currentURL.includes('/dashboard/leave/new') ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log('='.repeat(80) + '\n')

  console.log('💡 Browser will stay open for inspection...\n')
  await new Promise(() => {})

} catch (error) {
  console.error('\n❌ Test Error:', error.message)
  console.error(error.stack)
  console.log('\n💡 Browser will stay open for inspection...\n')
  await new Promise(() => {})
}
