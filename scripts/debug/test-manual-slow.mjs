#!/usr/bin/env node
/**
 * Slow Manual Testing Script - November 2, 2025
 * Developer: Maurice Rondeau
 * Tests all fixes with delays to observe behavior
 */

import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'
const PILOT_EMAIL = 'mrondeau@airniugini.com.pg'
const PILOT_PASSWORD = 'Lemakot@1972'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function testDisciplinaryFormUUID() {
  console.log('\n════════════════════════════════════════════')
  console.log('🧪 TEST 1: Disciplinary Form UUID Fix')
  console.log('════════════════════════════════════════════\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    slowMo: 50,
  })
  const page = await browser.newPage()

  try {
    console.log('→ Step 1: Navigate to admin login page')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
    await delay(1000)

    console.log('→ Step 2: Enter admin credentials')
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 100 })
    await delay(500)
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 100 })
    await delay(1000)

    console.log('→ Step 3: Submit login form')
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    await delay(2000)

    console.log('→ Step 4: Navigate to disciplinary matters')
    await page.goto(`${BASE_URL}/dashboard/disciplinary`, { waitUntil: 'networkidle2' })
    await delay(2000)

    console.log('→ Step 5: Find and click first disciplinary matter')
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    const matterLinks = await page.$$('table tbody tr a')
    if (matterLinks.length === 0) {
      console.log('❌ FAIL: No disciplinary matters found in table')
      await browser.close()
      return
    }

    console.log(`→ Found ${matterLinks.length} matter(s)`)
    await matterLinks[0].click()
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await delay(2000)

    console.log('→ Step 6: Wait for form to load')
    await page.waitForSelector('form', { timeout: 10000 })
    await delay(1000)

    console.log('→ Step 7: Clear "Assigned To" field (set to empty)')
    const assignedToSelect = await page.$('select[name="assigned_to"]')
    if (assignedToSelect) {
      await page.select('select[name="assigned_to"]', '')
      console.log('→ Set assigned_to to empty string')
    } else {
      console.log('⚠️  Warning: assigned_to select not found')
    }
    await delay(1000)

    console.log('→ Step 8: Submit form')
    await page.click('button[type="submit"]')
    await delay(3000)

    console.log('→ Step 9: Check for errors')
    const errorElements = await page.$$('.text-red-600, .text-red-500, [role="alert"]')

    if (errorElements.length > 0) {
      const errorText = await page.evaluate((el) => el.textContent, errorElements[0])
      if (errorText.toLowerCase().includes('uuid')) {
        console.log(`❌ FAIL: UUID error still occurring: "${errorText}"`)
      } else {
        console.log(`⚠️  WARNING: Different error: "${errorText}"`)
      }
    } else {
      console.log('✅ PASS: No UUID errors - form submitted successfully')
    }

    await delay(2000)
  } catch (error) {
    console.log(`❌ FAIL: Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function testTasksEditPage() {
  console.log('\n════════════════════════════════════════════')
  console.log('🧪 TEST 2: Tasks Edit Page 404 Fix')
  console.log('════════════════════════════════════════════\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    slowMo: 50,
  })
  const page = await browser.newPage()

  try {
    console.log('→ Step 1: Navigate to admin login page')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
    await delay(1000)

    console.log('→ Step 2: Enter admin credentials')
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 100 })
    await delay(500)
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 100 })
    await delay(1000)

    console.log('→ Step 3: Submit login form')
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    await delay(2000)

    console.log('→ Step 4: Navigate to tasks page')
    await page.goto(`${BASE_URL}/dashboard/tasks`, { waitUntil: 'networkidle2' })
    await delay(2000)

    console.log('→ Step 5: Find first task')
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    const taskLinks = await page.$$('table tbody tr a')
    if (taskLinks.length === 0) {
      console.log('❌ FAIL: No tasks found in table')
      await browser.close()
      return
    }

    console.log(`→ Found ${taskLinks.length} task(s)`)
    const firstTaskHref = await page.evaluate((el) => el.href, taskLinks[0])
    console.log(`→ Task URL: ${firstTaskHref}`)

    await delay(1000)

    console.log('→ Step 6: Navigate to task edit page')
    const editUrl = `${firstTaskHref}/edit`
    console.log(`→ Edit URL: ${editUrl}`)

    await page.goto(editUrl, { waitUntil: 'networkidle2' })
    await delay(3000)

    console.log('→ Step 7: Check if page loaded correctly')
    const currentUrl = page.url()
    const pageText = await page.evaluate(() => document.body.textContent)

    console.log(`→ Current URL: ${currentUrl}`)

    if (currentUrl.includes('/tasks') && !currentUrl.includes('/edit')) {
      console.log('❌ FAIL: Redirected away from edit page (likely 404)')
    } else if (pageText.includes('404') || pageText.includes('Not Found')) {
      console.log('❌ FAIL: 404 error page displayed')
    } else if (pageText.includes('Edit Task') || currentUrl.includes('/edit')) {
      console.log('✅ PASS: Edit page loaded successfully')
    } else {
      console.log(`⚠️  UNKNOWN: Unexpected page state`)
    }

    await delay(2000)
  } catch (error) {
    console.log(`❌ FAIL: Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function testFlightRequestTypes() {
  console.log('\n════════════════════════════════════════════')
  console.log('🧪 TEST 3: Flight Request Form Request Types')
  console.log('════════════════════════════════════════════\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    slowMo: 50,
  })
  const page = await browser.newPage()

  try {
    console.log('→ Step 1: Clear browser cache')
    await page.setCacheEnabled(false)
    await delay(500)

    console.log('→ Step 2: Navigate to pilot portal login page')
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })
    await delay(1000)

    console.log('→ Step 3: Enter pilot credentials')
    await page.type('input[type="email"]', PILOT_EMAIL, { delay: 100 })
    await delay(500)
    await page.type('input[type="password"]', PILOT_PASSWORD, { delay: 100 })
    await delay(1000)

    console.log('→ Step 4: Submit login form')
    await page.click('button[type="submit"]')
    await delay(4000) // Wait for redirect

    console.log('→ Step 5: Navigate to flight request form')
    await page.goto(`${BASE_URL}/portal/flight-requests/new`, { waitUntil: 'networkidle2' })
    await delay(2000)

    console.log('→ Step 6: Find request type dropdown')
    await page.waitForSelector('select', { timeout: 10000 })

    const options = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'))
      const requestTypeSelect = selects.find(
        (s) =>
          s.name === 'request_type' ||
          s.id === 'request_type' ||
          Array.from(s.options).some((opt) => opt.value === 'FLIGHT_REQUEST' || opt.value === 'RDO')
      )

      if (!requestTypeSelect) return null

      return Array.from(requestTypeSelect.options).map((opt) => ({
        value: opt.value,
        text: opt.textContent.trim(),
      }))
    })

    if (!options) {
      console.log('❌ FAIL: Could not find request type dropdown')
      await browser.close()
      return
    }

    console.log('\n→ Found dropdown options:')
    options.forEach((opt) => {
      console.log(`   - ${opt.value}: ${opt.text}`)
    })

    const expectedTypes = ['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY']
    const foundValues = options.map((o) => o.value).filter((v) => v !== '')

    const hasOldTypes = foundValues.some(
      (v) =>
        v.includes('ADDITIONAL_FLIGHT') ||
        v.includes('ROUTE_CHANGE') ||
        v.includes('SCHEDULE_PREFERENCE')
    )

    const hasNewTypes = expectedTypes.every((type) => foundValues.includes(type))

    console.log('\n→ Analysis:')
    console.log(`   Expected types: ${expectedTypes.join(', ')}`)
    console.log(`   Found types: ${foundValues.join(', ')}`)
    console.log(`   Has old types: ${hasOldTypes}`)
    console.log(`   Has all new types: ${hasNewTypes}`)

    if (hasOldTypes) {
      console.log('\n❌ FAIL: Still showing old request types')
    } else if (hasNewTypes) {
      console.log('\n✅ PASS: Showing correct new types only')
    } else {
      console.log('\n⚠️  WARNING: Unexpected types found')
    }

    await delay(2000)
  } catch (error) {
    console.log(`❌ FAIL: Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

// Run all tests sequentially
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗')
  console.log('║  Slow Manual Test Suite - November 2, 2025 ║')
  console.log('╚════════════════════════════════════════════╝')

  await testDisciplinaryFormUUID()
  await delay(3000)

  await testTasksEditPage()
  await delay(3000)

  await testFlightRequestTypes()

  console.log('\n════════════════════════════════════════════')
  console.log('📊 All tests completed!')
  console.log('════════════════════════════════════════════\n')
}

runAllTests().catch((error) => {
  console.error('\n❌ Fatal error running tests:', error)
  process.exit(1)
})
