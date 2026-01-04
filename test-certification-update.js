/**
 * Test Certification Expiry Date Update
 * Verifies if certification expiry date updates work
 */

const puppeteer = require('puppeteer')

const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'
const BASE_URL = 'http://localhost:3000'

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testCertificationUpdate() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 CERTIFICATION EXPIRY DATE UPDATE TEST')
  console.log('='.repeat(80) + '\n')

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300,
    defaultViewport: { width: 1920, height: 1080 },
  })

  const page = await browser.newPage()

  // Log console messages
  page.on('console', (msg) => console.log('🌐 Browser:', msg.text()))

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...')
    await page.goto(`${BASE_URL}/auth/login`)
    await page.type('#email', ADMIN_EMAIL)
    await page.type('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForNavigation()
    console.log('✅ Logged in\n')

    // Step 2: Go to certifications list
    console.log('📝 Step 2: Going to certifications list...')
    await page.goto(`${BASE_URL}/dashboard/certifications`)
    await wait(2000)
    console.log('✅ Certifications list loaded\n')

    // Step 3: Find first edit button
    console.log('📝 Step 3: Opening first certification edit page...')
    const editLink = await page.$('a[href*="/dashboard/certifications/"][href*="/edit"]')

    if (!editLink) {
      console.error('❌ No edit button found - no certifications to test')
      await browser.close()
      return
    }

    const href = await page.evaluate((el) => el.getAttribute('href'), editLink)
    const certId = href.split('/')[3]
    console.log(`✅ Found certification ID: ${certId}\n`)

    await editLink.click()
    await page.waitForNavigation()
    await wait(2000)
    console.log('✅ Edit page loaded\n')

    // Step 4: Get current expiry date
    console.log('📝 Step 4: Reading current expiry date...')
    const currentDate = await page.$eval('#expiry_date', (el) => el.value)
    console.log(`📊 Current expiry date: ${currentDate}`)

    // Step 5: Change expiry date (add 30 days)
    const date = new Date(currentDate)
    date.setDate(date.getDate() + 30)
    const newDate = date.toISOString().split('T')[0]
    console.log(`📝 Will change to: ${newDate}\n`)

    console.log('📝 Step 5: Changing expiry date...')
    await page.$eval(
      '#expiry_date',
      (el, val) => {
        el.value = val
        el.dispatchEvent(new Event('change', { bubbles: true }))
      },
      newDate
    )
    await wait(1000)

    const afterChange = await page.$eval('#expiry_date', (el) => el.value)
    console.log(`✅ Date field now shows: ${afterChange}\n`)

    // Step 6: Submit form
    console.log('📝 Step 6: Clicking "Save Changes" button...')
    console.log('⏰ WATCH SERVER LOGS NOW!\n')

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const saveBtn = buttons.find((btn) => btn.textContent.includes('Save Changes'))
      if (saveBtn) {
        saveBtn.click()
      }
    })

    console.log('🔄 Button clicked, waiting for response...\n')

    // Wait for navigation
    try {
      await page.waitForNavigation({ timeout: 10000 })
      console.log('✅ Navigation completed\n')
    } catch (e) {
      console.log('⚠️  No navigation occurred\n')
    }

    await wait(3000)

    // Step 7: Navigate back to edit page to verify
    console.log('📝 Step 7: Going back to edit page to verify...')
    await page.goto(`${BASE_URL}/dashboard/certifications/${certId}/edit`)
    await wait(2000)

    const verifiedDate = await page.$eval('#expiry_date', (el) => el.value)
    console.log(`📊 Date after save: ${verifiedDate}\n`)

    // Step 8: Check certifications list
    console.log('📝 Step 8: Checking certifications list...')
    await page.goto(`${BASE_URL}/dashboard/certifications`)
    await wait(2000)

    // Final Results
    console.log('='.repeat(80))
    console.log('📊 TEST RESULTS')
    console.log('='.repeat(80))
    console.log(`Original Date:           ${currentDate}`)
    console.log(`Intended New Date:       ${newDate}`)
    console.log(`Date After Submit:       ${verifiedDate}`)
    console.log('='.repeat(80))

    if (verifiedDate === newDate) {
      console.log('\n✅ SUCCESS: Expiry date update worked and persisted!')
      console.log('✅ The certification form is working correctly!\n')
    } else if (verifiedDate === currentDate) {
      console.log('\n❌ FAILURE: Date did NOT change')
      console.log('❌ Form submission may not be working\n')
    } else {
      console.log('\n⚠️  PARTIAL: Date changed but may not be correct\n')
    }

    console.log('⏱️  Keeping browser open for 10 seconds...\n')
    await wait(10000)
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
  } finally {
    await browser.close()
    console.log('✅ Browser closed\n')
  }
}

testCertificationUpdate()
