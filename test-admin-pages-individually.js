/**
 * Individual Admin Page Testing Script
 * Tests each admin page one by one and reports detailed errors
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

const adminPages = [
  { name: 'Dashboard Overview', url: '/dashboard', expectApi: false },
  { name: 'Pilots Management', url: '/dashboard/pilots', expectApi: true },
  { name: 'Certifications Management', url: '/dashboard/certifications', expectApi: true },
  { name: 'Leave Requests Management', url: '/dashboard/leave-requests', expectApi: true },
  { name: 'Analytics Dashboard', url: '/dashboard/analytics', expectApi: true },
  { name: 'Flight Requests', url: '/dashboard/flight-requests', expectApi: true },
  { name: 'Tasks Management', url: '/dashboard/tasks', expectApi: true },
  { name: 'Admin Settings', url: '/dashboard/admin/settings', expectApi: false },
  { name: 'Audit Logs', url: '/dashboard/audit-logs', expectApi: true },
]

console.log('\n' + '='.repeat(80))
console.log('  🧪 INDIVIDUAL ADMIN PAGE TESTING')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 50,
})

const page = await browser.newPage()

// Track API calls and errors
const apiCalls = new Map()
const consoleErrors = []
const pageErrors = []

page.on('response', async (response) => {
  const url = response.url()
  if (url.includes('/api/')) {
    const apiPath = url.split('/api/')[1].split('?')[0]
    apiCalls.set(apiPath, {
      status: response.status(),
      ok: response.ok(),
      url: url,
    })
  }
})

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
  }
})

page.on('pageerror', (error) => {
  pageErrors.push(error.message)
})

// Login first
console.log('📝 Step 1: Logging into Admin Portal...\n')
await page.goto(`${CONFIG.BASE_URL}/auth/login`, { waitUntil: 'networkidle2' })
await sleep(1000)

await page.type('input[type="email"]', CONFIG.ADMIN_CREDENTIALS.email, { delay: 50 })
await sleep(500)
await page.type('input[type="password"]', CONFIG.ADMIN_CREDENTIALS.password, { delay: 50 })
await sleep(500)

await page.click('button[type="submit"]')
await page.waitForNavigation({ waitUntil: 'networkidle2' })
await sleep(2000)

console.log('✅ Login successful\n')
console.log('='.repeat(80))
console.log('  📊 TESTING EACH PAGE INDIVIDUALLY')
console.log('='.repeat(80) + '\n')

const results = []

for (const pageInfo of adminPages) {
  console.log(`\n🧪 Testing: ${pageInfo.name}`)
  console.log(`   URL: ${pageInfo.url}`)

  // Clear tracking
  apiCalls.clear()
  consoleErrors.length = 0
  pageErrors.length = 0

  try {
    // Navigate to page
    await page.goto(`${CONFIG.BASE_URL}${pageInfo.url}`, {
      waitUntil: 'networkidle2',
      timeout: 10000,
    })

    await sleep(3000) // Wait for any async operations

    // Check current URL
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    // Check if redirected
    const wasRedirected = !currentUrl.includes(pageInfo.url)

    if (wasRedirected) {
      console.log(`   ⚠️  REDIRECTED to: ${currentUrl}`)
      results.push({
        page: pageInfo.name,
        status: 'REDIRECTED',
        url: pageInfo.url,
        redirectedTo: currentUrl,
        apiCalls: [],
        errors: [],
      })
      continue
    }

    // Check page title
    const title = await page.title()
    console.log(`   Page Title: ${title}`)

    // Check for API calls
    const pageCalls = Array.from(apiCalls.entries()).map(([path, info]) => ({
      path,
      status: info.status,
      ok: info.ok,
    }))

    if (pageCalls.length > 0) {
      console.log(`   📡 API Calls:`)
      pageCalls.forEach((call) => {
        const icon = call.ok ? '✅' : '❌'
        console.log(`      ${icon} /api/${call.path}: ${call.status}`)
      })
    } else {
      console.log(`   📡 No API calls detected`)
    }

    // Check for errors
    if (consoleErrors.length > 0) {
      console.log(`   ❌ Console Errors:`)
      consoleErrors.slice(0, 3).forEach((err) => {
        console.log(`      - ${err.substring(0, 100)}`)
      })
    }

    if (pageErrors.length > 0) {
      console.log(`   ❌ Page Errors:`)
      pageErrors.slice(0, 3).forEach((err) => {
        console.log(`      - ${err.substring(0, 100)}`)
      })
    }

    // Check for content
    const hasContent = await page.evaluate(() => {
      const main = document.querySelector('main')
      return main && main.textContent.trim().length > 100
    })

    console.log(`   Content: ${hasContent ? '✅ Present' : '❌ Missing'}`)

    // Determine status
    let status = 'PASSED'
    if (!hasContent) status = 'NO_CONTENT'
    if (pageErrors.length > 0) status = 'PAGE_ERROR'
    if (consoleErrors.length > 0 && status === 'PASSED') status = 'CONSOLE_ERROR'
    if (pageInfo.expectApi && pageCalls.length === 0) status = 'NO_API'

    // Check if API calls failed
    const failedCalls = pageCalls.filter((c) => !c.ok)
    if (failedCalls.length > 0) status = 'API_ERROR'

    const icon = status === 'PASSED' ? '✅' : '❌'
    console.log(`   ${icon} Status: ${status}`)

    results.push({
      page: pageInfo.name,
      status,
      url: pageInfo.url,
      title,
      apiCalls: pageCalls,
      consoleErrors: consoleErrors.slice(0, 3),
      pageErrors: pageErrors.slice(0, 3),
      hasContent,
    })
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.push({
      page: pageInfo.name,
      status: 'FAILED',
      url: pageInfo.url,
      error: error.message,
      apiCalls: [],
      errors: [error.message],
    })
  }

  await sleep(1000)
}

// Print summary
console.log('\n' + '='.repeat(80))
console.log('  📊 DETAILED TEST SUMMARY')
console.log('='.repeat(80) + '\n')

const passed = results.filter((r) => r.status === 'PASSED')
const failed = results.filter((r) => r.status !== 'PASSED')

console.log(`Total Pages Tested: ${results.length}`)
console.log(`✅ Fully Working: ${passed.length}`)
console.log(`❌ Issues Found: ${failed.length}\n`)

if (failed.length > 0) {
  console.log('PAGES WITH ISSUES:\n')
  failed.forEach((result, index) => {
    console.log(`${index + 1}. ${result.page} - ${result.status}`)
    console.log(`   URL: ${result.url}`)

    if (result.redirectedTo) {
      console.log(`   Issue: Redirected to ${result.redirectedTo}`)
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }

    if (result.apiCalls && result.apiCalls.length > 0) {
      const failed = result.apiCalls.filter((c) => !c.ok)
      if (failed.length > 0) {
        console.log(`   Failed API Calls:`)
        failed.forEach((call) => {
          console.log(`      - /api/${call.path}: ${call.status}`)
        })
      }
    }

    if (result.pageErrors && result.pageErrors.length > 0) {
      console.log(`   Page Errors:`)
      result.pageErrors.forEach((err) => {
        console.log(`      - ${err.substring(0, 80)}`)
      })
    }

    console.log('')
  })
}

console.log('='.repeat(80))
console.log('\n💡 Browser will stay open for manual inspection.')
console.log('   Close browser window when done.\n')

// Keep browser open
await new Promise(() => {})
