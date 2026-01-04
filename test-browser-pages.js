/**
 * Browser-based Page Testing with Playwright
 * Tests actual page rendering in a real browser
 */

const { chromium } = require('playwright')

const baseUrl = 'http://localhost:3000'

const pagesToTest = [
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/dashboard/pilots', name: 'Pilots List' },
  { path: '/dashboard/certifications', name: 'Certifications' },
  { path: '/dashboard/certifications/expiring', name: 'Expiring Certifications' },
  { path: '/dashboard/leave', name: 'Leave Requests' },
  { path: '/dashboard/leave/calendar', name: 'Leave Calendar' },
  { path: '/dashboard/leave/approve', name: 'Leave Approval' },
  { path: '/dashboard/flight-requests', name: 'Flight Requests' },
  { path: '/dashboard/feedback', name: 'Feedback' },
  { path: '/dashboard/analytics', name: 'Analytics' },
  { path: '/dashboard/admin', name: 'Admin Dashboard' },
  { path: '/dashboard/disciplinary', name: 'Disciplinary Actions' },
  { path: '/dashboard/tasks', name: 'Tasks' },
  { path: '/dashboard/audit-logs', name: 'Audit Logs' },
]

async function testPagesInBrowser() {
  console.log('🌐 Testing Dashboard Pages in Browser\n')
  console.log('━'.repeat(80))

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = []

  // First, check if we get redirected to login (expected for unauthenticated)
  try {
    console.log('🔐 Testing authentication redirect...')
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      console.log('✅ Correctly redirects to login page\n')
    } else {
      console.log('⚠️  Did not redirect to login (might be authenticated)\n')
    }
  } catch (err) {
    console.log(`❌ Failed to load dashboard: ${err.message}\n`)
  }

  // Test each page
  for (const pageInfo of pagesToTest) {
    try {
      console.log(`Testing: ${pageInfo.name}`)

      await page.goto(`${baseUrl}${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })

      // Check for common error indicators
      const pageContent = await page.content()
      const hasError =
        pageContent.includes('Something went wrong') ||
        pageContent.includes('404') ||
        pageContent.includes('Internal Server Error') ||
        pageContent.includes('Error:')

      // Check if page loaded (not a blank page)
      const hasContent = pageContent.length > 1000 // Reasonable page should have content

      // Check current URL (might redirect to login)
      const currentUrl = page.url()
      const redirectedToLogin = currentUrl.includes('/auth/login')

      let status = '✅ OK'
      let details = ''

      if (hasError) {
        status = '❌ ERROR ON PAGE'
        // Try to extract error message
        const errorText = await page.textContent('body').catch(() => 'Unknown error')
        details = ` - ${errorText.substring(0, 100)}`
      } else if (!hasContent && !redirectedToLogin) {
        status = '⚠️  BLANK PAGE'
      } else if (redirectedToLogin) {
        status = '✅ PROTECTED (redirects to login)'
      }

      results.push({
        ...pageInfo,
        status,
        details,
        hasError: status.includes('❌'),
        url: currentUrl,
      })

      console.log(`  ${status}${details}`)
    } catch (err) {
      results.push({
        ...pageInfo,
        status: '❌ FAILED TO LOAD',
        details: ` - ${err.message}`,
        hasError: true,
      })
      console.log(`  ❌ FAILED TO LOAD - ${err.message}`)
    }

    // Small delay between pages
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  await browser.close()

  console.log('━'.repeat(80))

  // Summary
  const ok = results.filter((r) => r.status.includes('✅')).length
  const errors = results.filter((r) => r.hasError).length
  const warnings = results.filter((r) => r.status.includes('⚠️')).length

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Passing: ${ok}/${results.length}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)

  if (errors > 0) {
    console.log(`\n❌ ${errors} page(s) have errors in the browser.`)
    console.log('\nPages with errors:')
    results
      .filter((r) => r.hasError)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.details}`)
      })
    process.exit(1)
  } else {
    console.log(`\n✅ All pages render correctly in the browser!`)
    process.exit(0)
  }
}

testPagesInBrowser().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
