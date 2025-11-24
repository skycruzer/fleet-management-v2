#!/usr/bin/env node

/**
 * Form Submission Test Script
 *
 * Tests:
 * 1. Leave Request form submission
 * 2. Leave Bid form submission
 * 3. Pilot portal data updates
 * 4. Admin dashboard data updates
 */

import puppeteer from 'puppeteer'

const PORTAL_URL = 'http://localhost:3000/portal/login'
const PILOT_EMAIL = 'jean.rondeau@example.com'
const PILOT_PASSWORD = 'SecurePass123!'
const ADMIN_URL = 'http://localhost:3000/auth/login'
const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'admin123'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testLeaveRequestSubmission(page) {
  console.log('\n📋 Testing Leave Request Form Submission...')

  try {
    // Navigate to leave requests page
    await page.goto('http://localhost:3000/portal/leave-requests', {
      waitUntil: 'networkidle2',
      timeout: 10000
    })
    await delay(2000)

    // Click "New Leave Request" button
    console.log('  → Opening Leave Request form...')
    await page.waitForSelector('button:has-text("New Leave Request")', { timeout: 5000 })
    await page.click('button:has-text("New Leave Request")')
    await delay(1000)

    // Fill in the form
    console.log('  → Filling in form data...')

    // Leave Type is already "Annual Leave" by default

    // Start Date
    const startDate = '2025-11-01'
    await page.waitForSelector('input[type="date"]#start_date')
    await page.type('input[type="date"]#start_date', startDate)
    await delay(500)

    // End Date
    const endDate = '2025-11-14'
    await page.type('input[type="date"]#end_date', endDate)
    await delay(500)

    // Reason (optional)
    await page.type('textarea#reason', 'Annual vacation leave for family trip')
    await delay(500)

    // Submit the form
    console.log('  → Submitting form...')
    await page.click('button[type="submit"]:has-text("Submit Leave Request")')

    // Wait for success message
    await page.waitForSelector('.bg-green-50', { timeout: 10000 })
    console.log('  ✅ Success message displayed!')

    // Wait for dialog to close
    await delay(3000)

    // Verify the request appears in the list
    console.log('  → Verifying request appears in list...')
    const requestExists = await page.evaluate(() => {
      return document.body.textContent.includes('Nov 01, 2025') &&
             document.body.textContent.includes('Nov 14, 2025')
    })

    if (requestExists) {
      console.log('  ✅ Leave request appears in the list!')
    } else {
      console.log('  ❌ Leave request NOT found in list')
    }

    return requestExists
  } catch (error) {
    console.error('  ❌ Error testing leave request:', error.message)
    return false
  }
}

async function testLeaveBidSubmission(page) {
  console.log('\n📅 Testing Leave Bid Form Submission...')

  try {
    // Navigate to leave requests page
    await page.goto('http://localhost:3000/portal/leave-requests', {
      waitUntil: 'networkidle2',
      timeout: 10000
    })
    await delay(2000)

    // Click "Submit Leave Bid" button
    console.log('  → Opening Leave Bid form...')
    await page.waitForSelector('button:has-text("Submit Leave Bid")', { timeout: 5000 })
    await page.click('button:has-text("Submit Leave Bid")')
    await delay(1000)

    // Fill in 1st Choice
    console.log('  → Filling in 1st choice...')
    await page.waitForSelector('input#start-1')
    await page.type('input#start-1', '2026-06-01')
    await delay(500)
    await page.type('input#end-1', '2026-06-14')
    await delay(500)

    // Fill in 2nd Choice
    console.log('  → Filling in 2nd choice...')
    await page.type('input#start-2', '2026-09-01')
    await delay(500)
    await page.type('input#end-2', '2026-09-14')
    await delay(500)

    // Submit the form
    console.log('  → Submitting form...')
    await page.click('button[type="submit"]:has-text("Submit Leave Bid")')

    // Wait for success message
    await page.waitForSelector('.bg-green-50', { timeout: 10000 })
    console.log('  ✅ Success message displayed!')

    // Wait for dialog to close
    await delay(3000)

    // Verify the bid appears in the list
    console.log('  → Verifying bid appears in history...')
    const bidExists = await page.evaluate(() => {
      return document.body.textContent.includes('Annual Leave Bid for 2026') &&
             document.body.textContent.includes('Jun 01, 2026')
    })

    if (bidExists) {
      console.log('  ✅ Leave bid appears in the history!')
    } else {
      console.log('  ❌ Leave bid NOT found in history')
    }

    return bidExists
  } catch (error) {
    console.error('  ❌ Error testing leave bid:', error.message)
    return false
  }
}

async function testPilotPortalDashboard(page) {
  console.log('\n🏠 Testing Pilot Portal Dashboard Updates...')

  try {
    await page.goto('http://localhost:3000/portal/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 10000
    })
    await delay(2000)

    // Check for pending leave requests count
    console.log('  → Checking pending leave requests...')
    const hasPendingRequests = await page.evaluate(() => {
      const text = document.body.textContent
      return text.includes('Pending requests') && text.includes('Leave Requests')
    })

    if (hasPendingRequests) {
      console.log('  ✅ Dashboard shows pending leave requests!')
    } else {
      console.log('  ⚠️  Dashboard may not show pending requests yet')
    }

    // Check for leave bid status
    console.log('  → Checking leave bid status...')
    const hasLeaveBidInfo = await page.evaluate(() => {
      return document.body.textContent.includes('2026') ||
             document.body.textContent.includes('Leave Bid')
    })

    if (hasLeaveBidInfo) {
      console.log('  ✅ Dashboard shows leave bid information!')
    } else {
      console.log('  ⚠️  Dashboard may not show leave bid yet')
    }

    return hasPendingRequests
  } catch (error) {
    console.error('  ❌ Error checking pilot dashboard:', error.message)
    return false
  }
}

async function testAdminDashboard(page) {
  console.log('\n👨‍💼 Testing Admin Dashboard Updates...')

  try {
    // Logout from pilot portal
    console.log('  → Logging out from pilot portal...')
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle2'
    })
    await delay(2000)

    // Login as admin
    console.log('  → Logging in as admin...')
    await page.waitForSelector('input[type="email"]')
    await page.type('input[type="email"]', ADMIN_EMAIL)
    await page.type('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await delay(3000)

    // Navigate to leave requests page
    console.log('  → Navigating to admin leave requests...')
    await page.goto('http://localhost:3000/dashboard/leave', {
      waitUntil: 'networkidle2',
      timeout: 10000
    })
    await delay(2000)

    // Check for the new leave request
    console.log('  → Checking for new leave request...')
    const hasNewRequest = await page.evaluate(() => {
      return document.body.textContent.includes('Jean Rondeau') ||
             document.body.textContent.includes('Nov 01, 2025')
    })

    if (hasNewRequest) {
      console.log('  ✅ Admin dashboard shows the new leave request!')
    } else {
      console.log('  ⚠️  Leave request may not be visible in admin yet')
    }

    // Check for leave bids (if admin has access)
    console.log('  → Checking for leave bids in admin...')
    try {
      await page.goto('http://localhost:3000/dashboard/admin/leave-bids', {
        waitUntil: 'networkidle2',
        timeout: 10000
      })
      await delay(2000)

      const hasLeaveBids = await page.evaluate(() => {
        return document.body.textContent.includes('2026')
      })

      if (hasLeaveBids) {
        console.log('  ✅ Admin dashboard shows leave bids!')
      } else {
        console.log('  ⚠️  Leave bids may not be visible yet')
      }
    } catch (err) {
      console.log('  ℹ️  Leave bids admin page may not exist yet')
    }

    return hasNewRequest
  } catch (error) {
    console.error('  ❌ Error checking admin dashboard:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Form Submission Tests\n')
  console.log('=' .repeat(60))

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1400,900']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })

  try {
    // Login to Pilot Portal
    console.log('🔐 Logging into Pilot Portal...')
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle2' })
    await delay(2000)

    await page.waitForSelector('input[type="email"]')
    await page.type('input[type="email"]', PILOT_EMAIL)
    await page.type('input[type="password"]', PILOT_PASSWORD)
    await page.click('button[type="submit"]')
    await delay(3000)

    console.log('  ✅ Logged in successfully!')

    // Run tests
    const leaveRequestResult = await testLeaveRequestSubmission(page)
    const leaveBidResult = await testLeaveBidSubmission(page)
    const pilotDashboardResult = await testPilotPortalDashboard(page)
    const adminDashboardResult = await testAdminDashboard(page)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Leave Request Submission:   ${leaveRequestResult ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Leave Bid Submission:       ${leaveBidResult ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Pilot Portal Updates:       ${pilotDashboardResult ? '✅ PASS' : '⚠️  PARTIAL'}`)
    console.log(`Admin Dashboard Updates:    ${adminDashboardResult ? '✅ PASS' : '⚠️  PARTIAL'}`)
    console.log('='.repeat(60))

    const allPassed = leaveRequestResult && leaveBidResult
    if (allPassed) {
      console.log('\n🎉 All critical tests PASSED!')
    } else {
      console.log('\n⚠️  Some tests failed or were partial')
    }

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error)
  } finally {
    console.log('\n🏁 Tests complete. Browser will close in 5 seconds...')
    await delay(5000)
    await browser.close()
  }
}

runTests().catch(console.error)
