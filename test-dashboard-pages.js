/**
 * Dashboard Pages Test Script
 * Tests all main dashboard pages for 404 errors and loading issues
 */

const http = require('http')

const baseUrl = 'http://localhost:3001'

// List of main dashboard pages to test
const dashboardPages = [
  '/dashboard',
  '/dashboard/pilots',
  '/dashboard/certifications',
  '/dashboard/certifications/expiring',
  '/dashboard/leave',
  '/dashboard/leave/calendar',
  '/dashboard/leave/approve',
  '/dashboard/flight-requests',
  '/dashboard/feedback',
  '/dashboard/analytics',
  '/dashboard/admin',
  '/dashboard/admin/check-types',
  '/dashboard/admin/leave-bids',
  '/dashboard/admin/pilot-registrations',
  '/dashboard/renewal-planning',
  '/dashboard/renewal-planning/calendar',
  '/dashboard/disciplinary',
  '/dashboard/tasks',
  '/dashboard/audit',
  '/dashboard/audit-logs',
  '/dashboard/settings',
  '/dashboard/support',
  '/dashboard/faqs',
]

function testPage(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    }

    const req = http.request(options, (res) => {
      const status = res.statusCode
      const redirectLocation = res.headers.location

      let result = {
        path,
        status,
        result: 'UNKNOWN',
      }

      if (status === 200) {
        result.result = '✅ OK'
      } else if (status === 302 || status === 307) {
        if (redirectLocation && redirectLocation.includes('/auth/login')) {
          result.result = '✅ PROTECTED (redirects to login)'
        } else {
          result.result = `⚠️  REDIRECT to ${redirectLocation}`
        }
      } else if (status === 404) {
        result.result = '❌ 404 NOT FOUND'
      } else if (status === 500) {
        result.result = '❌ 500 SERVER ERROR'
      } else {
        result.result = `⚠️  ${status}`
      }

      resolve(result)
    })

    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        result: `❌ ERROR: ${err.message}`,
      })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        path,
        status: 'TIMEOUT',
        result: '❌ TIMEOUT',
      })
    })

    req.end()
  })
}

async function runTests() {
  console.log('🧪 Testing Dashboard Pages...\n')
  console.log(`Base URL: ${baseUrl}\n`)
  console.log('━'.repeat(80))

  const results = []

  for (const page of dashboardPages) {
    const result = await testPage(page)
    results.push(result)
    console.log(`${result.result.padEnd(40)} ${page}`)

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('━'.repeat(80))

  // Summary
  const ok = results.filter((r) => r.result.includes('✅')).length
  const errors = results.filter((r) => r.result.includes('❌')).length
  const warnings = results.filter((r) => r.result.includes('⚠️')).length

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Passing: ${ok}/${results.length}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)

  if (errors > 0) {
    console.log(`\n❌ Some pages have errors. Please review.`)
    process.exit(1)
  } else {
    console.log(`\n✅ All dashboard pages are accessible!`)
    process.exit(0)
  }
}

runTests().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
