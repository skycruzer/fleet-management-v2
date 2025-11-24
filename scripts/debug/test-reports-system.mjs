/**
 * Reports System Testing Script
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Comprehensive test of all 19 report API endpoints
 */

import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'admin123'

const TEST_RESULTS = {
  ui: { passed: 0, failed: 0, tests: [] },
  fleet: { passed: 0, failed: 0, tests: [] },
  certification: { passed: 0, failed: 0, tests: [] },
  leave: { passed: 0, failed: 0, tests: [] },
  operational: { passed: 0, failed: 0, tests: [] },
  system: { passed: 0, failed: 0, tests: [] }
}

async function login(page) {
  console.log('🔐 Logging in as admin...')

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle0' })

  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.type('input[type="email"]', ADMIN_EMAIL)
  await page.type('input[type="password"]', ADMIN_PASSWORD)

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ])

  console.log('✅ Login successful')
}

async function testReportsPageUI(page) {
  console.log('\n📋 Testing Reports Page UI...')

  try {
    // Navigate to Reports page
    await page.goto(`${BASE_URL}/dashboard/reports`, { waitUntil: 'networkidle0' })

    // Test 1: Page loads
    const pageTitle = await page.title()
    TEST_RESULTS.ui.tests.push({
      name: 'Reports page loads',
      passed: pageTitle.includes('Reports') || pageTitle.includes('Fleet Management'),
      details: `Page title: ${pageTitle}`
    })
    TEST_RESULTS.ui.passed++

    // Test 2: All category tabs visible
    const tabs = await page.$$('[role="tablist"] button')
    const tabCount = tabs.length
    TEST_RESULTS.ui.tests.push({
      name: '5 category tabs visible',
      passed: tabCount === 5,
      details: `Found ${tabCount} tabs (expected 5)`
    })
    if (tabCount === 5) TEST_RESULTS.ui.passed++
    else TEST_RESULTS.ui.failed++

    // Test 3: Search input exists
    const searchInput = await page.$('input[type="text"][placeholder*="Search"]')
    TEST_RESULTS.ui.tests.push({
      name: 'Search input exists',
      passed: !!searchInput,
      details: searchInput ? 'Search input found' : 'Search input NOT found'
    })
    if (searchInput) TEST_RESULTS.ui.passed++
    else TEST_RESULTS.ui.failed++

    // Test 4: Report cards visible
    const reportCards = await page.$$('[class*="report-card"], .border.rounded-lg')
    const cardCount = reportCards.length
    TEST_RESULTS.ui.tests.push({
      name: 'Report cards visible',
      passed: cardCount >= 4, // At least 4 fleet reports should be visible
      details: `Found ${cardCount} report cards`
    })
    if (cardCount >= 4) TEST_RESULTS.ui.passed++
    else TEST_RESULTS.ui.failed++

    // Test 5: Generate button exists
    const generateButtons = await page.$$('button:has-text("Generate"), button:has-text("CSV"), button:has-text("Excel")')
    TEST_RESULTS.ui.tests.push({
      name: 'Generate buttons exist',
      passed: generateButtons.length > 0,
      details: `Found ${generateButtons.length} generate/format buttons`
    })
    if (generateButtons.length > 0) TEST_RESULTS.ui.passed++
    else TEST_RESULTS.ui.failed++

    console.log(`✅ UI Tests: ${TEST_RESULTS.ui.passed} passed, ${TEST_RESULTS.ui.failed} failed`)

  } catch (error) {
    console.error('❌ UI Test Error:', error.message)
    TEST_RESULTS.ui.failed++
    TEST_RESULTS.ui.tests.push({
      name: 'UI Test Suite',
      passed: false,
      details: `Error: ${error.message}`
    })
  }
}

async function testAPIEndpoint(page, category, reportId, reportName, format = 'csv') {
  const endpoint = `/api/reports/${category}/${reportId}`
  const testName = `${reportName} (${format.toUpperCase()})`

  try {
    console.log(`  Testing: ${testName}...`)

    // Make API request
    const response = await page.evaluate(async (url, fmt) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: fmt,
          parameters: fmt === 'ical' ? {
            dateRange: {
              start: '2025-01-01',
              end: '2025-12-31'
            }
          } : {}
        })
      })

      return {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        contentDisposition: res.headers.get('content-disposition'),
        ok: res.ok
      }
    }, endpoint, format)

    const passed = response.ok && response.status === 200

    TEST_RESULTS[category].tests.push({
      name: testName,
      passed,
      details: passed
        ? `✓ ${response.status} - ${response.contentType}`
        : `✗ ${response.status} ${response.statusText}`
    })

    if (passed) {
      TEST_RESULTS[category].passed++
      console.log(`    ✅ ${response.status} - ${response.contentType}`)
    } else {
      TEST_RESULTS[category].failed++
      console.log(`    ❌ ${response.status} ${response.statusText}`)
    }

  } catch (error) {
    TEST_RESULTS[category].failed++
    TEST_RESULTS[category].tests.push({
      name: testName,
      passed: false,
      details: `Error: ${error.message}`
    })
    console.log(`    ❌ Error: ${error.message}`)
  }
}

async function testFleetReports(page) {
  console.log('\n🚁 Testing Fleet Reports (4 reports)...')

  await testAPIEndpoint(page, 'fleet', 'active-roster', 'Active Pilot Roster', 'csv')
  await testAPIEndpoint(page, 'fleet', 'active-roster', 'Active Pilot Roster', 'excel')
  await testAPIEndpoint(page, 'fleet', 'demographics', 'Fleet Demographics', 'excel')
  await testAPIEndpoint(page, 'fleet', 'retirement-forecast', 'Retirement Forecast', 'excel')
  await testAPIEndpoint(page, 'fleet', 'succession-pipeline', 'Succession Pipeline', 'excel')

  console.log(`Fleet Reports: ${TEST_RESULTS.fleet.passed} passed, ${TEST_RESULTS.fleet.failed} failed`)
}

async function testCertificationReports(page) {
  console.log('\n📜 Testing Certification Reports (4 reports)...')

  await testAPIEndpoint(page, 'certifications', 'all', 'All Certifications', 'csv')
  await testAPIEndpoint(page, 'certifications', 'all', 'All Certifications', 'excel')
  await testAPIEndpoint(page, 'certifications', 'expiring', 'Expiring Certifications', 'csv')
  await testAPIEndpoint(page, 'certifications', 'expiring', 'Expiring Certifications', 'excel')
  await testAPIEndpoint(page, 'certifications', 'compliance', 'Fleet Compliance', 'excel')
  await testAPIEndpoint(page, 'certifications', 'renewal-schedule', 'Renewal Schedule', 'ical')

  console.log(`Certification Reports: ${TEST_RESULTS.certification.passed} passed, ${TEST_RESULTS.certification.failed} failed`)
}

async function testLeaveReports(page) {
  console.log('\n🌴 Testing Leave Reports (4 reports)...')

  await testAPIEndpoint(page, 'leave', 'request-summary', 'Leave Request Summary', 'csv')
  await testAPIEndpoint(page, 'leave', 'request-summary', 'Leave Request Summary', 'excel')
  await testAPIEndpoint(page, 'leave', 'annual-allocation', 'Annual Allocation', 'excel')
  await testAPIEndpoint(page, 'leave', 'bid-summary', 'Bid Summary', 'excel')
  await testAPIEndpoint(page, 'leave', 'calendar-export', 'Calendar Export', 'ical')

  console.log(`Leave Reports: ${TEST_RESULTS.leave.passed} passed, ${TEST_RESULTS.leave.failed} failed`)
}

async function testOperationalReports(page) {
  console.log('\n⚙️ Testing Operational Reports (3 reports)...')

  await testAPIEndpoint(page, 'operational', 'flight-requests', 'Flight Requests', 'csv')
  await testAPIEndpoint(page, 'operational', 'flight-requests', 'Flight Requests', 'excel')
  await testAPIEndpoint(page, 'operational', 'task-completion', 'Task Completion', 'excel')
  await testAPIEndpoint(page, 'operational', 'disciplinary', 'Disciplinary Actions', 'csv')

  console.log(`Operational Reports: ${TEST_RESULTS.operational.passed} passed, ${TEST_RESULTS.operational.failed} failed`)
}

async function testSystemReports(page) {
  console.log('\n🖥️ Testing System Reports (4 reports)...')

  // System reports require date range
  const endpoint1 = '/api/reports/system/audit-log'
  const endpoint2 = '/api/reports/system/user-activity'
  const endpoint3 = '/api/reports/system/feedback'
  const endpoint4 = '/api/reports/system/health'

  const dateParams = {
    dateRange: {
      start: '2025-10-01',
      end: '2025-11-03'
    }
  }

  // Test with date range parameters
  for (const [endpoint, name, format] of [
    [endpoint1, 'Audit Log', 'csv'],
    [endpoint1, 'Audit Log', 'excel'],
    [endpoint2, 'User Activity', 'excel'],
    [endpoint3, 'Feedback Summary', 'csv'],
    [endpoint3, 'Feedback Summary', 'excel'],
    [endpoint4, 'System Health', 'excel']
  ]) {
    try {
      console.log(`  Testing: ${name} (${format.toUpperCase()})...`)

      const response = await page.evaluate(async (url, fmt, params) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: fmt, parameters: params })
        })

        return {
          status: res.status,
          statusText: res.statusText,
          contentType: res.headers.get('content-type'),
          ok: res.ok
        }
      }, endpoint, format, dateParams)

      const passed = response.ok && response.status === 200

      TEST_RESULTS.system.tests.push({
        name: `${name} (${format.toUpperCase()})`,
        passed,
        details: passed
          ? `✓ ${response.status} - ${response.contentType}`
          : `✗ ${response.status} ${response.statusText}`
      })

      if (passed) {
        TEST_RESULTS.system.passed++
        console.log(`    ✅ ${response.status} - ${response.contentType}`)
      } else {
        TEST_RESULTS.system.failed++
        console.log(`    ❌ ${response.status} ${response.statusText}`)
      }

    } catch (error) {
      TEST_RESULTS.system.failed++
      TEST_RESULTS.system.tests.push({
        name: `${name} (${format.toUpperCase()})`,
        passed: false,
        details: `Error: ${error.message}`
      })
      console.log(`    ❌ Error: ${error.message}`)
    }
  }

  console.log(`System Reports: ${TEST_RESULTS.system.passed} passed, ${TEST_RESULTS.system.failed} failed`)
}

function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 REPORTS SYSTEM TEST RESULTS')
  console.log('='.repeat(80))

  const totalPassed = Object.values(TEST_RESULTS).reduce((sum, cat) => sum + cat.passed, 0)
  const totalFailed = Object.values(TEST_RESULTS).reduce((sum, cat) => sum + cat.failed, 0)
  const totalTests = totalPassed + totalFailed

  console.log('\n📈 SUMMARY')
  console.log('-'.repeat(80))
  console.log(`Total Tests Run: ${totalTests}`)
  console.log(`✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`)

  console.log('\n📋 BY CATEGORY')
  console.log('-'.repeat(80))
  for (const [category, results] of Object.entries(TEST_RESULTS)) {
    const total = results.passed + results.failed
    const percentage = total > 0 ? ((results.passed/total)*100).toFixed(1) : '0.0'
    console.log(`${category.toUpperCase().padEnd(20)} - ${results.passed}/${total} passed (${percentage}%)`)
  }

  console.log('\n🔍 DETAILED RESULTS')
  console.log('-'.repeat(80))
  for (const [category, results] of Object.entries(TEST_RESULTS)) {
    if (results.tests.length > 0) {
      console.log(`\n${category.toUpperCase()}:`)
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌'
        console.log(`  ${icon} ${test.name}`)
        if (test.details) {
          console.log(`     ${test.details}`)
        }
      })
    }
  }

  console.log('\n' + '='.repeat(80))

  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Reports system is fully functional.')
  } else {
    console.log(`⚠️ ${totalFailed} test(s) failed. Review details above.`)
  }

  return { totalPassed, totalFailed, totalTests, results: TEST_RESULTS }
}

async function saveTestReport(reportData) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `REPORTS-TEST-RESULTS-${timestamp}.md`

  let markdown = `# Reports System Test Results\n\n`
  markdown += `**Date**: ${new Date().toISOString()}\n`
  markdown += `**Total Tests**: ${reportData.totalTests}\n`
  markdown += `**Passed**: ${reportData.totalPassed} (${((reportData.totalPassed/reportData.totalTests)*100).toFixed(1)}%)\n`
  markdown += `**Failed**: ${reportData.totalFailed} (${((reportData.totalFailed/reportData.totalTests)*100).toFixed(1)}%)\n\n`

  markdown += `## Summary by Category\n\n`
  for (const [category, results] of Object.entries(reportData.results)) {
    const total = results.passed + results.failed
    const percentage = total > 0 ? ((results.passed/total)*100).toFixed(1) : '0.0'
    markdown += `- **${category.toUpperCase()}**: ${results.passed}/${total} passed (${percentage}%)\n`
  }

  markdown += `\n## Detailed Results\n\n`
  for (const [category, results] of Object.entries(reportData.results)) {
    if (results.tests.length > 0) {
      markdown += `### ${category.toUpperCase()}\n\n`
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌'
        markdown += `${icon} **${test.name}**\n`
        if (test.details) {
          markdown += `   - ${test.details}\n`
        }
        markdown += `\n`
      })
    }
  }

  if (reportData.totalFailed === 0) {
    markdown += `## 🎉 Conclusion\n\nAll tests passed! The Reports system is fully functional and ready for production.\n`
  } else {
    markdown += `## ⚠️ Issues Found\n\n${reportData.totalFailed} test(s) failed. Review the detailed results above.\n`
  }

  await fs.writeFile(filename, markdown)
  console.log(`\n📄 Test report saved: ${filename}`)
}

async function main() {
  console.log('🚀 Starting Reports System Test Suite...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 })

    // Login
    await login(page)

    // Run all tests
    await testReportsPageUI(page)
    await testFleetReports(page)
    await testCertificationReports(page)
    await testLeaveReports(page)
    await testOperationalReports(page)
    await testSystemReports(page)

    // Generate and save report
    const reportData = generateReport()
    await saveTestReport(reportData)

  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
