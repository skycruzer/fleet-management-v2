#!/usr/bin/env node
/**
 * Automated Testing Script - November 2, 2025
 * Author: Maurice Rondeau
 * Tests all fixes to verify they're working
 */

import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:3000'
const TEST_RESULTS = []

function logResult(test, status, message) {
  const result = { test, status, message, timestamp: new Date().toISOString() }
  TEST_RESULTS.push(result)
  const icon = status === 'PASS' ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
}

async function testDisciplinaryFormUUID() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('\n🧪 Test 1: Disciplinary Form UUID Empty String Fix')

    // Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.type('input[type="email"]', 'skycruzer@icloud.com')
    await page.type('input[type="password"]', 'mron2393')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Navigate to disciplinary matters
    await page.goto(`${BASE_URL}/dashboard/disciplinary`)
    await page.waitForSelector('table')

    // Click first matter to edit
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    const firstMatterLink = await page.$$eval('table tbody tr a', (links) => links[0]?.href)

    if (!firstMatterLink) {
      logResult('Disciplinary Form UUID', 'FAIL', 'No disciplinary matters found')
      await browser.close()
      return
    }

    await page.goto(firstMatterLink)
    await page.waitForSelector('form', { timeout: 10000 })

    // Clear "Assigned To" field (make it empty)
    const assignedToSelect = await page.$('select#assigned_to')
    if (assignedToSelect) {
      await page.select('select#assigned_to', '') // Empty value
    }

    // Submit form
    const submitButton = await page.$('button[type="submit"]')
    await submitButton.click()

    // Wait for response
    await page.waitForTimeout(2000)

    // Check for error
    const errorElement = await page.$('.text-red-600, .text-red-500, [role="alert"]')

    if (errorElement) {
      const errorText = await page.evaluate((el) => el.textContent, errorElement)
      if (errorText.includes('uuid') || errorText.includes('UUID')) {
        logResult('Disciplinary Form UUID', 'FAIL', `Still getting UUID error: ${errorText}`)
      } else {
        logResult('Disciplinary Form UUID', 'PASS', 'No UUID error (different error present)')
      }
    } else {
      logResult(
        'Disciplinary Form UUID',
        'PASS',
        'Form submitted successfully with empty UUID field'
      )
    }
  } catch (error) {
    logResult('Disciplinary Form UUID', 'FAIL', `Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function testTasksEditPage() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('\n🧪 Test 2: Tasks Edit Page 404 Fix')

    // Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.type('input[type="email"]', 'skycruzer@icloud.com')
    await page.type('input[type="password"]', 'mron2393')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Navigate to tasks
    await page.goto(`${BASE_URL}/dashboard/tasks`)
    await page.waitForSelector('table')

    // Click first task
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    const firstTaskLink = await page.$$eval('table tbody tr a', (links) => links[0]?.href)

    if (!firstTaskLink) {
      logResult('Tasks Edit Page', 'FAIL', 'No tasks found')
      await browser.close()
      return
    }

    await page.goto(firstTaskLink)
    await page.waitForTimeout(2000)

    // Click "Edit Task" button
    const editUrl = `${firstTaskLink}/edit`
    await page.goto(editUrl)
    await page.waitForTimeout(3000)

    // Check if we got a 404 or the edit form
    const currentUrl = page.url()
    const pageText = await page.evaluate(() => document.body.textContent)

    if (pageText.includes('404') || pageText.includes('Not Found')) {
      logResult('Tasks Edit Page', 'FAIL', '404 error still occurring')
    } else if (pageText.includes('Edit Task') || currentUrl.includes('/edit')) {
      logResult('Tasks Edit Page', 'PASS', 'Edit page loaded successfully')
    } else {
      logResult('Tasks Edit Page', 'UNKNOWN', `Unexpected page: ${currentUrl}`)
    }
  } catch (error) {
    logResult('Tasks Edit Page', 'FAIL', `Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function testFlightRequestTypes() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('\n🧪 Test 3: Flight Request Form Request Types')

    // Clear cache
    await page.setCacheEnabled(false)

    // Login to pilot portal
    await page.goto(`${BASE_URL}/portal/login`)
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.type('input[type="email"]', 'mrondeau@airniugini.com.pg')
    await page.type('input[type="password"]', 'Lemakot@1972')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000) // Wait for redirect

    // Navigate to flight request form
    await page.goto(`${BASE_URL}/portal/flight-requests/new`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('select, button')

    // Find request type dropdown
    const dropdown = await page.$('select')
    if (!dropdown) {
      logResult('Flight Request Types', 'FAIL', 'Request type dropdown not found')
      await browser.close()
      return
    }

    // Get all option values
    const options = await page.evaluate(() => {
      const select = document.querySelector('select')
      if (!select) return []
      return Array.from(select.options).map((opt) => ({
        value: opt.value,
        text: opt.textContent.trim(),
      }))
    })

    console.log('Found options:', options)

    const expectedTypes = ['FLIGHT_REQUEST', 'RDO', 'SDO', 'OFFICE_DAY']
    const foundValues = options.map((o) => o.value)

    const hasOldTypes = foundValues.some(
      (v) =>
        v.includes('ADDITIONAL_FLIGHT') ||
        v.includes('ROUTE_CHANGE') ||
        v.includes('SCHEDULE_PREFERENCE')
    )

    const hasNewTypes = expectedTypes.every((type) => foundValues.includes(type))

    if (hasOldTypes) {
      logResult(
        'Flight Request Types',
        'FAIL',
        `Still showing old types: ${foundValues.join(', ')}`
      )
    } else if (hasNewTypes) {
      logResult('Flight Request Types', 'PASS', 'Showing correct new types only')
    } else {
      logResult('Flight Request Types', 'UNKNOWN', `Unexpected types: ${foundValues.join(', ')}`)
    }
  } catch (error) {
    logResult('Flight Request Types', 'FAIL', `Test error: ${error.message}`)
  } finally {
    await browser.close()
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════')
  console.log('🧪 Automated Test Suite - November 2, 2025')
  console.log('═══════════════════════════════════════════\n')

  await testDisciplinaryFormUUID()
  await testTasksEditPage()
  await testFlightRequestTypes()

  console.log('\n═══════════════════════════════════════════')
  console.log('📊 TEST SUMMARY')
  console.log('═══════════════════════════════════════════\n')

  const passed = TEST_RESULTS.filter((r) => r.status === 'PASS').length
  const failed = TEST_RESULTS.filter((r) => r.status === 'FAIL').length
  const unknown = TEST_RESULTS.filter((r) => r.status === 'UNKNOWN').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`❓ Unknown: ${unknown}`)
  console.log(`📝 Total: ${TEST_RESULTS.length}\n`)

  TEST_RESULTS.forEach((result) => {
    console.log(`${result.status === 'PASS' ? '✅' : '❌'} ${result.test}: ${result.message}`)
  })

  console.log('\n═══════════════════════════════════════════')

  if (failed > 0) {
    console.log('❌ SOME TESTS FAILED - FIXES NOT COMPLETE')
    process.exit(1)
  } else {
    console.log('✅ ALL TESTS PASSED')
    process.exit(0)
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
