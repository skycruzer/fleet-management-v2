/**
 * Test Certification Editing and Cache Invalidation
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
console.log('  🧪 TESTING CERTIFICATION EDIT & CACHE INVALIDATION')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 150
})

const page = await browser.newPage()

// Enable request/response logging
page.on('response', async (response) => {
  const url = response.url()
  if (url.includes('/api/certifications/')) {
    const status = response.status()
    const method = response.request().method()
    console.log(`📡 API ${method} - Status: ${status}`)

    if (method === 'PUT') {
      try {
        const json = await response.json()
        console.log('📤 PUT Response:', JSON.stringify(json, null, 2))
      } catch (e) {
        // Response might not be JSON
      }
    }
  }
})

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log('❌ Browser Error:', msg.text())
  }
})

try {
  // Login
  console.log('📝 Step 1: Logging into Admin Portal...')
  await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
  await sleep(1000)

  await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })
  await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ Login successful\n')

  // Navigate to Pilots page
  console.log('📝 Step 2: Navigating to Pilots page...')
  await page.goto(`${CONFIG.BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle2' })
  await sleep(2000)
  console.log('✅ On pilots page\n')

  // Click on first pilot
  console.log('📝 Step 3: Clicking on first pilot...')
  const firstPilotRow = await page.$('tbody tr')
  if (!firstPilotRow) {
    throw new Error('No pilots found in table')
  }
  await firstPilotRow.click()
  await sleep(3000)
  console.log('✅ Pilot detail page loaded\n')

  // Get pilot name for logging
  const pilotName = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    return h1 ? h1.textContent.trim() : 'Unknown'
  })
  console.log(`👤 Testing with pilot: ${pilotName}\n`)

  // Click "View & Edit Certifications" button
  console.log('📝 Step 4: Opening certifications modal...')
  await page.waitForSelector('button')
  const buttons = await page.$$('button')
  let viewCertsButton = null
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn)
    if (text && text.includes('View & Edit Certifications')) {
      viewCertsButton = btn
      break
    }
  }

  if (!viewCertsButton) {
    throw new Error('View & Edit Certifications button not found')
  }
  await viewCertsButton.click()
  await sleep(2000)
  console.log('✅ Certifications modal opened\n')

  console.log('💡 Test ready - Please manually:')
  console.log('   1. Click Edit on any certification')
  console.log('   2. Change the expiry date')
  console.log('   3. Click Save')
  console.log('   4. Observe if the date updates in the modal')
  console.log('   5. Close the modal and check if counts updated\n')

  console.log('⚠️  Browser will stay open for manual testing.')
  console.log('   Close browser window when done.\n')

  // Keep browser open
  await new Promise(() => {})

} catch (error) {
  console.error('\n❌ Test Error:', error.message)
  console.error(error.stack)

  console.log('\n💡 Browser will stay open for inspection.')
  await new Promise(() => {})
}
