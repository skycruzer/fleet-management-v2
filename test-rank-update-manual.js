/**
 * Manual Browser Test for Pilot Rank Update
 * Uses Puppeteer to simulate user interaction
 */

const puppeteer = require('puppeteer')

const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'
const BASE_URL = 'http://localhost:3000'

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testRankUpdate() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 MANUAL BROWSER TEST: PILOT RANK UPDATE')
  console.log('='.repeat(80) + '\n')

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Enable console logging from the page
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[API]') || text.includes('[updatePilot]')) {
      console.log('🌐 Browser Console:', text)
    }
  })

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in as admin...')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle0' })
    await wait(1000)

    await page.type('#email', ADMIN_EMAIL)
    await page.type('#password', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(2000)

    console.log('✅ Login successful\n')

    // Step 2: Go to pilots list
    console.log('📝 Step 2: Navigating to pilots list...')
    await page.goto(`${BASE_URL}/dashboard/pilots`, { waitUntil: 'networkidle0' })
    await wait(1000)

    console.log('✅ Pilots list loaded\n')

    // Step 3: Get first pilot's edit link
    console.log('📝 Step 3: Finding first pilot to edit...')
    const editLink = await page.$('a[href*="/dashboard/pilots/"][href*="/edit"]')

    if (!editLink) {
      console.error('❌ No edit button found')
      await browser.close()
      return
    }

    // Get the pilot ID from the href
    const href = await page.evaluate((el) => el.getAttribute('href'), editLink)
    const pilotId = href.split('/')[3]
    console.log('✅ Found pilot ID:', pilotId)

    // Step 4: Go to edit page
    console.log('\n📝 Step 4: Opening edit page...')
    await editLink.click()
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await wait(2000)

    console.log('✅ Edit page loaded\n')

    // Step 5: Get current rank
    console.log('📝 Step 5: Reading current rank...')
    const currentRank = await page.evaluate(() => {
      const roleSelect = document.querySelector('#role')
      return roleSelect ? roleSelect.value : null
    })

    console.log('📊 Current rank:', currentRank)

    if (!currentRank) {
      console.error('❌ Could not find rank dropdown')
      await browser.close()
      return
    }

    // Step 6: Change rank
    const newRank = currentRank === 'Captain' ? 'First Officer' : 'Captain'
    console.log(`\n📝 Step 6: Changing rank from "${currentRank}" to "${newRank}"...`)

    // Use JavaScript to directly change the value (more reliable than select)
    await page.evaluate((rank) => {
      const roleSelect = document.querySelector('#role')
      if (roleSelect) {
        roleSelect.value = rank
        // Trigger change event to notify React Hook Form
        const event = new Event('change', { bubbles: true })
        roleSelect.dispatchEvent(event)
      }
    }, newRank)

    await wait(1000)

    const selectedRank = await page.evaluate(() => {
      const roleSelect = document.querySelector('#role')
      return roleSelect ? roleSelect.value : null
    })

    console.log('✅ Rank changed in dropdown to:', selectedRank)

    if (selectedRank !== newRank) {
      console.error('⚠️  WARNING: Dropdown value did not change!')
      console.error(`   Expected: ${newRank}`)
      console.error(`   Got: ${selectedRank}`)
    }

    // Step 7: Take screenshot before save
    await page.screenshot({
      path: 'test-results/rank-update-before-save.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: rank-update-before-save.png')

    // Step 8: Click Save Changes
    console.log('\n📝 Step 7: Clicking "Save Changes" button...')
    console.log('⏰ Watch the server logs now!\n')

    // Find save button more reliably
    const saveButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      return buttons.find((btn) => btn.textContent.includes('Update Pilot')) !== undefined
    })

    if (!saveButton) {
      console.error('❌ Save button not found')
      await browser.close()
      return
    }

    // Click using JavaScript to avoid clickability issues
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const saveBtn = buttons.find((btn) => btn.textContent.includes('Update Pilot'))
      if (saveBtn) {
        saveBtn.click()
      }
    })

    console.log('🔄 Save button clicked, waiting for response...\n')

    // Wait for navigation or error
    try {
      await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle0' })
      console.log('✅ Navigation completed after save\n')
    } catch (e) {
      console.log('⚠️  No navigation occurred (might be form error)\n')
    }

    await wait(2000)

    // Step 9: Take screenshot after save
    await page.screenshot({
      path: 'test-results/rank-update-after-save.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: rank-update-after-save.png')

    // Step 10: Check if we're on pilot detail or edit page
    const currentUrl = page.url()
    console.log('📍 Current URL:', currentUrl)

    // Step 11: Go back to edit page to verify
    console.log('\n📝 Step 8: Returning to edit page to verify...')
    await page.goto(`${BASE_URL}/dashboard/pilots/${pilotId}/edit`, { waitUntil: 'networkidle0' })
    await wait(2000)

    const verifiedRank = await page.evaluate(() => {
      const roleSelect = document.querySelector('#role')
      return roleSelect ? roleSelect.value : null
    })

    console.log('📊 Rank after save (edit page):', verifiedRank)

    // Step 12: Check pilot detail page
    console.log('\n📝 Step 9: Checking pilot detail page...')
    await page.goto(`${BASE_URL}/dashboard/pilots/${pilotId}`, { waitUntil: 'networkidle0' })
    await wait(2000)

    await page.screenshot({
      path: 'test-results/rank-update-detail-page.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: rank-update-detail-page.png')

    // Try to find rank on detail page
    const detailPageRank = await page.evaluate(() => {
      const body = document.body.textContent
      if (body.includes('Captain') && !body.includes('First Officer')) return 'Captain'
      if (body.includes('First Officer')) return 'First Officer'
      return 'Unknown'
    })

    console.log('📊 Rank on detail page:', detailPageRank)

    // Step 13: Final verification
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST RESULTS:')
    console.log('='.repeat(80))
    console.log('Original Rank:', currentRank)
    console.log('Intended New Rank:', newRank)
    console.log('Rank After Save (Edit Page):', verifiedRank)
    console.log('Rank On Detail Page:', detailPageRank)

    if (verifiedRank === newRank) {
      console.log('\n✅ SUCCESS: Rank update persisted!')
    } else {
      console.log('\n❌ FAILURE: Rank did not persist')
      console.log(`   Expected: ${newRank}`)
      console.log(`   Got: ${verifiedRank}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('⏱️  Keeping browser open for 10 seconds for review...')
    await wait(10000)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    await page.screenshot({
      path: 'test-results/rank-update-error.png',
      fullPage: true,
    })
  } finally {
    await browser.close()
    console.log('✅ Browser closed\n')
  }
}

testRankUpdate()
