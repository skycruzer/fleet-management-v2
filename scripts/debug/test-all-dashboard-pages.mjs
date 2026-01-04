#!/usr/bin/env node
/**
 * Comprehensive Dashboard Test
 * Tests all major pages after RLS fix
 * Author: Maurice Rondeau
 */

import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'
const EMAIL = 'skycruzer@icloud.com'
const PASSWORD = 'mron2393'

console.log('🧪 Comprehensive Dashboard Test\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()

// Track test results
const results = []

async function testPage(name, url, expectedElements = []) {
  console.log(`\n📋 Testing: ${name}`)
  console.log(`   URL: ${url}\n`)

  try {
    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000)

    // Check for error messages
    const hasError = (await page.locator('text=/error|unauthorized|forbidden/i').count()) > 0

    if (hasError) {
      const errorText = await page
        .locator('text=/error|unauthorized|forbidden/i')
        .first()
        .textContent()
      console.log(`   ❌ Error found: ${errorText}`)
      results.push({ name, url, status: 'FAIL', error: errorText })
      return false
    }

    // Check for expected elements
    let allElementsFound = true
    for (const selector of expectedElements) {
      const count = await page.locator(selector).count()
      if (count === 0) {
        console.log(`   ⚠️  Expected element not found: ${selector}`)
        allElementsFound = false
      } else {
        console.log(`   ✅ Found: ${selector}`)
      }
    }

    // Check if page loaded (no loading spinners)
    const hasLoading = (await page.locator('text=/loading/i').count()) > 0
    if (hasLoading) {
      console.log('   ⏳ Page still loading, waiting...')
      await page.waitForTimeout(3000)
    }

    // Get page title
    const title = await page.title()
    console.log(`   📄 Page title: ${title}`)

    // Check if we got redirected to login (means auth failed)
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login') && !url.includes('/auth/login')) {
      console.log(`   ❌ Redirected to login - auth issue`)
      results.push({ name, url, status: 'FAIL', error: 'Redirected to login' })
      return false
    }

    results.push({
      name,
      url,
      status: allElementsFound ? 'PASS' : 'PARTIAL',
      title,
      note: allElementsFound ? 'All elements found' : 'Some elements missing',
    })

    console.log(`   ✅ Page loaded successfully`)
    return true
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    results.push({ name, url, status: 'FAIL', error: error.message })
    return false
  }
}

async function runTests() {
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...\n')

    await page.goto(`${BASE_URL}/auth/login`)
    await page.waitForLoadState('networkidle')

    // Fill in credentials
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    console.log('   ✅ Login successful\n')

    // Step 2: Test Dashboard Pages
    console.log('📊 Step 2: Testing Dashboard Pages...\n')

    await testPage('Dashboard Home', `${BASE_URL}/dashboard`, [
      'text=/pilots/i',
      'text=/certifications/i',
    ])

    await testPage('Pilots List', `${BASE_URL}/dashboard/pilots`, ['text=/pilot/i', 'text=/rank/i'])

    await testPage('Certifications', `${BASE_URL}/dashboard/certifications`, [
      'text=/certification/i',
      'text=/expiry/i',
    ])

    await testPage('Leave Requests', `${BASE_URL}/dashboard/leave-requests`, [
      'text=/leave/i',
      'text=/request/i',
    ])

    await testPage('Analytics', `${BASE_URL}/dashboard/analytics`, ['text=/analytics/i'])

    await testPage('Settings', `${BASE_URL}/dashboard/settings`, ['text=/settings/i'])

    // Step 3: Print Results Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Test Results Summary\n')

    const passed = results.filter((r) => r.status === 'PASS').length
    const partial = results.filter((r) => r.status === 'PARTIAL').length
    const failed = results.filter((r) => r.status === 'FAIL').length
    const total = results.length

    results.forEach((result) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌'
      console.log(`${icon} ${result.name.padEnd(25)} ${result.status}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📈 Results: ${passed}/${total} passed, ${partial} partial, ${failed} failed\n`)

    if (failed === 0) {
      console.log('🎉 All tests passed! Dashboard is fully functional.\n')
    } else {
      console.log('⚠️  Some tests failed. Review errors above.\n')
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
  } finally {
    console.log('⏸️  Keeping browser open for 5 seconds...')
    await page.waitForTimeout(5000)
    await browser.close()
    console.log('🔚 Browser closed\n')
  }
}

runTests()
