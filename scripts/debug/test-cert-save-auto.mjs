/**
 * Automated Certification Save Test
 */

import puppeteer from 'puppeteer'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ADMIN_CREDENTIALS: {
    email: 'skycruzer@icloud.com',
    password: 'mron2393',
  },
}

console.log('\n' + '='.repeat(80))
console.log('  🧪 AUTOMATED CERTIFICATION SAVE TEST')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 100,
})

const page = await browser.newPage()

// Capture all console logs
const logs = []
page.on('console', (msg) => {
  const text = msg.text()
  logs.push(text)
  console.log(`[BROWSER] ${text}`)
})

try {
  // Step 1: Login
  console.log('📝 Step 1: Logging in...')
  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ Logged in\n')

  // Step 2: Navigate to pilots page
  console.log('📝 Step 2: Navigating to pilots page...')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ On pilots page\n')

  // Step 3: Click first pilot
  console.log('📝 Step 3: Opening first pilot...')
  const firstPilot = await page.$('tbody tr')
  if (!firstPilot) throw new Error('No pilots found')
  await firstPilot.click()
  await sleep(3000)
  console.log('✅ Pilot detail page opened\n')

  // Step 4: Open certifications modal
  console.log('📝 Step 4: Opening certifications modal...')
  const buttons = await page.$$('button')
  let viewCertsButton = null
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn)
    if (text && text.includes('View & Edit Certifications')) {
      viewCertsButton = btn
      break
    }
  }
  if (!viewCertsButton) throw new Error('View & Edit Certifications button not found')
  await viewCertsButton.click()
  await sleep(3000)
  console.log('✅ Certifications modal opened\n')

  // Step 5: Find first certification and click Edit
  console.log('📝 Step 5: Finding first certification to edit...')
  const editButtons = await page.$$('button')
  let firstEditButton = null
  for (const btn of editButtons) {
    const text = await page.evaluate((el) => el.textContent, btn)
    if (text && text.trim() === 'Edit') {
      firstEditButton = btn
      break
    }
  }
  if (!firstEditButton) throw new Error('No Edit button found')

  // Get original date before editing
  const originalDate = await page.evaluate(() => {
    const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'))
    return dateInputs.length > 0 ? dateInputs[0].value : null
  })
  console.log('📅 Original date:', originalDate)

  await firstEditButton.click()
  await sleep(1000)
  console.log('✅ Edit mode activated\n')

  // Step 6: Change date
  console.log('📝 Step 6: Changing expiry date...')
  const newDate = '2026-12-31'
  await page.evaluate((date) => {
    const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'))
    const visibleInput = dateInputs.find((input) => input.offsetParent !== null)
    if (visibleInput) {
      visibleInput.value = date
      visibleInput.dispatchEvent(new Event('input', { bubbles: true }))
      visibleInput.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, newDate)
  await sleep(500)
  console.log(`✅ Changed date to: ${newDate}\n`)

  // Step 7: Click Save
  console.log('📝 Step 7: Clicking Save...')
  const saveButtons = await page.$$('button')
  let saveButton = null
  for (const btn of saveButtons) {
    const text = await page.evaluate((el) => el.textContent, btn)
    if (text && text.includes('Save')) {
      const isVisible = await page.evaluate((el) => el.offsetParent !== null, btn)
      if (isVisible) {
        saveButton = btn
        break
      }
    }
  }
  if (!saveButton) throw new Error('Save button not found')

  // Clear previous logs before save
  logs.length = 0

  await saveButton.click()
  console.log('✅ Save clicked\n')

  // Step 8: Wait and check logs
  console.log('📝 Step 8: Waiting for save to complete...')
  await sleep(5000) // Give time for save + fetch

  console.log('\n' + '='.repeat(80))
  console.log('  📊 ANALYZING CONSOLE LOGS')
  console.log('='.repeat(80) + '\n')

  const saveLogs = logs.filter((l) => l.includes('[SAVE]'))
  const fetchLogs = logs.filter((l) => l.includes('[FETCH]'))

  console.log('💾 Save Logs:')
  saveLogs.forEach((log) => console.log('  ', log))

  console.log('\n🔄 Fetch Logs:')
  fetchLogs.forEach((log) => console.log('  ', log))

  // Step 9: Check if date updated in UI
  console.log('\n📝 Step 9: Checking if date updated in UI...')
  await sleep(2000)

  const dateFoundInUI = await page.evaluate((targetDate) => {
    // Look for the date in the UI
    const allText = document.body.innerText
    return allText.includes(targetDate)
  }, newDate)

  console.log('\n' + '='.repeat(80))
  console.log('  🎯 TEST RESULTS')
  console.log('='.repeat(80))
  console.log(`Original Date: ${originalDate}`)
  console.log(`New Date Set:  ${newDate}`)
  console.log(`Date in UI:    ${dateFoundInUI ? '✅ FOUND' : '❌ NOT FOUND'}`)
  console.log('='.repeat(80) + '\n')

  if (!dateFoundInUI) {
    console.log('❌ BUG CONFIRMED: Date did NOT update in UI after save\n')
    console.log('💡 Analyzing logs to find root cause...\n')

    // Check if API returned updated data
    const hasUpdatedApiData = logs.some((l) => l.includes(newDate))
    if (hasUpdatedApiData) {
      console.log('✅ API returned correct updated date')
      console.log('❌ Problem: UI not re-rendering with new data\n')
    } else {
      console.log('❌ API did NOT return updated date')
      console.log('❌ Problem: Either save failed or fetch returned stale data\n')
    }
  } else {
    console.log('✅ SUCCESS: Date updated correctly in UI!\n')
  }

  console.log('💡 Browser will stay open for inspection...\n')
  await new Promise(() => {})
} catch (error) {
  console.error('\n❌ Test Error:', error.message)
  console.error(error.stack)
  console.log('\n💡 Browser will stay open for inspection...\n')
  await new Promise(() => {})
}
