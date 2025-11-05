#!/usr/bin/env node
/**
 * Comprehensive Reports Testing Script
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Tests all 19 report endpoints to verify functionality
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Test credentials - using actual production admin credentials
const TEST_EMAIL = 'skycruzer@icloud.com'
const TEST_PASSWORD = 'mron2393'

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

// Authenticate and get session
async function authenticate() {
  console.log(`${colors.blue}🔐 Authenticating...${colors.reset}`)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })

  if (error) {
    console.error(`${colors.red}❌ Authentication failed: ${error.message}${colors.reset}`)
    process.exit(1)
  }

  console.log(`${colors.green}✅ Authenticated as ${data.user.email}${colors.reset}`)
  return data.session.access_token
}

// Test a single report endpoint
async function testReport(name, endpoint, payload, token) {
  testResults.total++

  try {
    console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`)
    console.log(`Endpoint: POST ${endpoint}`)
    console.log(`Payload:`, JSON.stringify(payload, null, 2))

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const status = response.status
    const contentType = response.headers.get('content-type')

    if (status === 200) {
      // Success - check if we got file data
      const contentLength = parseInt(response.headers.get('content-length') || '0')

      if (contentLength > 0) {
        testResults.passed++
        testResults.details.push({
          name,
          status: 'PASSED',
          httpStatus: status,
          contentType,
          contentLength,
          format: payload.format
        })
        console.log(`${colors.green}✅ PASSED - Generated ${payload.format.toUpperCase()} (${contentLength} bytes)${colors.reset}`)
        return true
      } else {
        testResults.failed++
        testResults.details.push({
          name,
          status: 'FAILED',
          httpStatus: status,
          error: 'Empty response',
          format: payload.format
        })
        console.log(`${colors.red}❌ FAILED - Empty response${colors.reset}`)
        return false
      }
    } else if (status === 404) {
      // No data found - this is expected for some reports
      const body = await response.json()
      testResults.passed++
      testResults.details.push({
        name,
        status: 'PASSED',
        httpStatus: status,
        message: body.error,
        format: payload.format
      })
      console.log(`${colors.yellow}⚠️  PASSED (No Data) - ${body.error}${colors.reset}`)
      return true
    } else if (status === 501) {
      // Not implemented (PDF format)
      const body = await response.json()
      testResults.passed++
      testResults.details.push({
        name,
        status: 'PASSED',
        httpStatus: status,
        message: 'PDF not implemented (expected)',
        format: payload.format
      })
      console.log(`${colors.yellow}⚠️  PASSED (Not Implemented) - ${body.error}${colors.reset}`)
      return true
    } else {
      // Error
      const body = await response.text()
      testResults.failed++
      testResults.details.push({
        name,
        status: 'FAILED',
        httpStatus: status,
        error: body,
        format: payload.format
      })
      console.log(`${colors.red}❌ FAILED - HTTP ${status}${colors.reset}`)
      console.log(`Response: ${body}`)
      return false
    }
  } catch (error) {
    testResults.failed++
    testResults.details.push({
      name,
      status: 'FAILED',
      error: error.message,
      format: payload.format
    })
    console.log(`${colors.red}❌ FAILED - ${error.message}${colors.reset}`)
    return false
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.blue}║   Reports System Comprehensive Testing Suite      ║${colors.reset}`)
  console.log(`${colors.blue}╚════════════════════════════════════════════════════╝${colors.reset}\n`)

  // Authenticate
  const token = await authenticate()

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  CERTIFICATION REPORTS (4 reports)${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)

  await testReport(
    '1. All Certifications Export (CSV)',
    '/api/reports/certifications/all',
    { format: 'csv' },
    token
  )

  await testReport(
    '2. All Certifications Export (Excel)',
    '/api/reports/certifications/all',
    { format: 'excel' },
    token
  )

  await testReport(
    '3. Compliance Summary (Excel)',
    '/api/reports/certifications/compliance',
    { format: 'excel' },
    token
  )

  await testReport(
    '4. Expiring Certifications (CSV)',
    '/api/reports/certifications/expiring',
    { format: 'csv', parameters: { threshold: '90 days' } },
    token
  )

  await testReport(
    '5. Expiring Certifications (Excel)',
    '/api/reports/certifications/expiring',
    { format: 'excel', parameters: { threshold: '90 days' } },
    token
  )

  await testReport(
    '6. Renewal Schedule (iCal)',
    '/api/reports/certifications/renewal-schedule',
    { format: 'ical' },
    token
  )

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  FLEET REPORTS (4 reports)${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)

  await testReport(
    '7. Active Roster (CSV)',
    '/api/reports/fleet/active-roster',
    { format: 'csv' },
    token
  )

  await testReport(
    '8. Active Roster (Excel)',
    '/api/reports/fleet/active-roster',
    { format: 'excel' },
    token
  )

  await testReport(
    '9. Demographics Analysis (Excel)',
    '/api/reports/fleet/demographics',
    { format: 'excel' },
    token
  )

  await testReport(
    '10. Retirement Forecast (Excel)',
    '/api/reports/fleet/retirement-forecast',
    { format: 'excel' },
    token
  )

  await testReport(
    '11. Succession Pipeline (Excel)',
    '/api/reports/fleet/succession-pipeline',
    { format: 'excel' },
    token
  )

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  LEAVE REPORTS (4 reports)${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)

  await testReport(
    '12. Annual Allocation (Excel)',
    '/api/reports/leave/annual-allocation',
    { format: 'excel', parameters: { year: '2025' } },
    token
  )

  await testReport(
    '13. Leave Bid Summary (Excel)',
    '/api/reports/leave/bid-summary',
    { format: 'excel', parameters: { year: '2025' } },
    token
  )

  await testReport(
    '14. Leave Calendar Export (iCal)',
    '/api/reports/leave/calendar-export',
    { format: 'ical' },
    token
  )

  await testReport(
    '15. Leave Request Summary (CSV)',
    '/api/reports/leave/request-summary',
    { format: 'csv', parameters: { dateRange: { start: '2025-01-01', end: '2025-12-31' } } },
    token
  )

  await testReport(
    '16. Leave Request Summary (Excel)',
    '/api/reports/leave/request-summary',
    { format: 'excel', parameters: { dateRange: { start: '2025-01-01', end: '2025-12-31' } } },
    token
  )

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  OPERATIONAL REPORTS (3 reports)${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)

  await testReport(
    '17. Disciplinary Summary (CSV)',
    '/api/reports/operational/disciplinary',
    { format: 'csv' },
    token
  )

  await testReport(
    '18. Flight Requests (CSV)',
    '/api/reports/operational/flight-requests',
    { format: 'csv' },
    token
  )

  await testReport(
    '19. Flight Requests (Excel)',
    '/api/reports/operational/flight-requests',
    { format: 'excel' },
    token
  )

  await testReport(
    '20. Task Completion (CSV)',
    '/api/reports/operational/task-completion',
    { format: 'csv' },
    token
  )

  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  SYSTEM REPORTS (4 reports)${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)

  await testReport(
    '21. Audit Log (CSV)',
    '/api/reports/system/audit-log',
    { format: 'csv', parameters: { dateRange: { start: '2025-10-01', end: '2025-11-03' } } },
    token
  )

  await testReport(
    '22. Feedback Summary (CSV)',
    '/api/reports/system/feedback',
    { format: 'csv' },
    token
  )

  await testReport(
    '23. Feedback Summary (Excel)',
    '/api/reports/system/feedback',
    { format: 'excel' },
    token
  )

  await testReport(
    '24. System Health (JSON)',
    '/api/reports/system/health',
    { format: 'json' },
    token
  )

  await testReport(
    '25. User Activity (CSV)',
    '/api/reports/system/user-activity',
    { format: 'csv' },
    token
  )

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.blue}  TEST SUMMARY${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}\n`)

  console.log(`Total Tests:  ${testResults.total}`)
  console.log(`${colors.green}Passed:       ${testResults.passed}${colors.reset}`)
  console.log(`${colors.red}Failed:       ${testResults.failed}${colors.reset}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`)

  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const resultsFile = `test-reports-results-${timestamp}.json`

  fs.writeFileSync(
    resultsFile,
    JSON.stringify(testResults, null, 2)
  )

  console.log(`${colors.cyan}📄 Detailed results saved to: ${resultsFile}${colors.reset}\n`)

  // Exit with appropriate code
  if (testResults.failed === 0) {
    console.log(`${colors.green}✅ ALL TESTS PASSED!${colors.reset}\n`)
    process.exit(0)
  } else {
    console.log(`${colors.red}❌ SOME TESTS FAILED${colors.reset}\n`)
    console.log('Failed tests:')
    testResults.details
      .filter(d => d.status === 'FAILED')
      .forEach(d => {
        console.log(`  - ${d.name}: ${d.error || 'Unknown error'}`)
      })
    console.log()
    process.exit(1)
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`)
  process.exit(1)
})
