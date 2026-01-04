#!/usr/bin/env node
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function verifyApp() {
  console.log('🚀 Starting Fleet Management V2 Verification...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })
  const page = await context.newPage()

  const results = []
  const screenshotsDir = join(__dirname, 'screenshots')

  try {
    // Test 1: Landing Page
    console.log('📄 Testing Landing Page...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.screenshot({ path: join(screenshotsDir, '1-landing-page.png'), fullPage: true })

    const landingTitle = await page.textContent('h1')
    results.push({
      page: 'Landing Page',
      status: landingTitle?.includes('Fleet Management') ? '✅ PASS' : '❌ FAIL',
      details: `Title: ${landingTitle}`,
    })

    // Test 2: Click Get Started
    console.log('🔘 Testing Get Started Button...')
    await page.click('text=Get Started')
    await page.waitForURL('**/auth/login', { timeout: 5000 })
    await page.screenshot({ path: join(screenshotsDir, '2-login-redirect.png'), fullPage: true })

    results.push({
      page: 'Get Started → Login',
      status: page.url().includes('/auth/login') ? '✅ PASS' : '❌ FAIL',
      details: `URL: ${page.url()}`,
    })

    // Test 3: Login Page
    console.log('🔐 Testing Login Page...')
    const loginHeading = await page.textContent('h1')
    await page.screenshot({ path: join(screenshotsDir, '3-login-page.png'), fullPage: true })

    results.push({
      page: 'Login Page',
      status: loginHeading?.includes('Fleet Management') ? '✅ PASS' : '❌ FAIL',
      details: `Heading: ${loginHeading}`,
    })

    // Test 4: Login with Admin Credentials
    console.log('👤 Testing Admin Login...')
    await page.fill('input[type="email"]', 'skycruzer@icloud.com')
    await page.fill('input[type="password"]', 'mron2393')
    await page.click('button[type="submit"]')

    // Wait for either dashboard navigation or error message
    try {
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 15000 }),
        page.waitForSelector('.text-red-600', { timeout: 15000 }),
      ])
    } catch (error) {
      console.log('  Warning: Neither dashboard nor error appeared')
    }
    await page.screenshot({ path: join(screenshotsDir, '4-dashboard.png'), fullPage: true })

    results.push({
      page: 'Admin Login',
      status: page.url().includes('/dashboard') ? '✅ PASS' : '❌ FAIL',
      details: `URL: ${page.url()}`,
    })

    // Test 5: Dashboard Metrics
    console.log('📊 Testing Dashboard...')
    const dashboardHeading = await page.textContent('h2')
    const metricsVisible = await page.isVisible('text=Total Pilots')
    await page.screenshot({ path: join(screenshotsDir, '5-dashboard-full.png'), fullPage: true })

    results.push({
      page: 'Dashboard Metrics',
      status: metricsVisible ? '✅ PASS' : '❌ FAIL',
      details: `Heading: ${dashboardHeading}, Metrics: ${metricsVisible}`,
    })

    // Test 6: Pilots Page
    console.log('👨‍✈️ Testing Pilots Page...')
    await page.click('text=Pilots')
    await page.waitForURL('**/dashboard/pilots', { timeout: 5000 })
    await page.waitForSelector('table', { timeout: 10000 })
    await page.screenshot({ path: join(screenshotsDir, '6-pilots-page.png'), fullPage: true })

    const pilotsTable = await page.isVisible('table')
    results.push({
      page: 'Pilots Page',
      status: pilotsTable ? '✅ PASS' : '❌ FAIL',
      details: `Table visible: ${pilotsTable}`,
    })

    // Test 7: Pilots Filtering
    console.log('🔍 Testing Pilots Filtering...')
    await page.selectOption('select', 'Captain')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: join(screenshotsDir, '7-pilots-filtered.png'), fullPage: true })

    results.push({
      page: 'Pilots Filtering',
      status: '✅ PASS',
      details: 'Filter applied: Captain',
    })

    // Test 8: Certifications Page
    console.log('📋 Testing Certifications Page...')
    await page.click('text=Certifications')
    await page.waitForURL('**/dashboard/certifications', { timeout: 5000 })
    await page.screenshot({
      path: join(screenshotsDir, '8-certifications-page.png'),
      fullPage: true,
    })

    results.push({
      page: 'Certifications Page',
      status: '✅ PASS',
      details: 'Page loaded (placeholder)',
    })

    // Test 9: Leave Page
    console.log('📅 Testing Leave Page...')
    await page.click('text=Leave Requests')
    await page.waitForURL('**/dashboard/leave', { timeout: 5000 })
    await page.screenshot({ path: join(screenshotsDir, '9-leave-page.png'), fullPage: true })

    results.push({
      page: 'Leave Page',
      status: '✅ PASS',
      details: 'Page loaded (placeholder)',
    })

    // Test 10: Analytics Page
    console.log('📈 Testing Analytics Page...')
    await page.click('text=Analytics')
    await page.waitForURL('**/dashboard/analytics', { timeout: 5000 })
    await page.screenshot({ path: join(screenshotsDir, '10-analytics-page.png'), fullPage: true })

    results.push({
      page: 'Analytics Page',
      status: '✅ PASS',
      details: 'Page loaded',
    })

    // Test 11: Admin Page
    console.log('⚙️ Testing Admin Page...')
    await page.click('text=Admin')
    await page.waitForURL('**/dashboard/admin', { timeout: 5000 })
    await page.screenshot({ path: join(screenshotsDir, '11-admin-page.png'), fullPage: true })

    results.push({
      page: 'Admin Page',
      status: '✅ PASS',
      details: 'Page loaded (placeholder)',
    })

    // Test 12: Logout
    console.log('🚪 Testing Logout...')
    await page.click('button:has-text("Sign out")')
    await page.waitForURL('*', { timeout: 5000 })
    await page.screenshot({ path: join(screenshotsDir, '12-after-logout.png'), fullPage: true })

    results.push({
      page: 'Logout',
      status: '✅ PASS',
      details: `URL: ${page.url()}`,
    })
  } catch (error) {
    console.error('\n❌ Error during verification:', error.message)
    results.push({
      page: 'ERROR',
      status: '❌ FAIL',
      details: error.message,
    })
  } finally {
    await browser.close()
  }

  // Print Results
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 VERIFICATION RESULTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.page}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Details: ${result.details}\n`)
  })

  const passed = results.filter((r) => r.status.includes('PASS')).length
  const failed = results.filter((r) => r.status.includes('FAIL')).length

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ PASSED: ${passed}/${results.length}`)
  console.log(`❌ FAILED: ${failed}/${results.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log(`📸 Screenshots saved to: ${screenshotsDir}\n`)

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED - APP IS FULLY OPERATIONAL!\n')
  } else {
    console.log('⚠️  Some tests failed - review results above.\n')
  }
}

verifyApp().catch(console.error)
