#!/usr/bin/env node

/**
 * Complete Pilot Registration Workflow Test
 *
 * Tests the entire flow:
 * 1. Register new pilot
 * 2. Admin login and approval
 * 3. Pilot login after approval
 */

import puppeteer from 'puppeteer'

const ADMIN_CREDENTIALS = {
  email: 'skycruzer@icloud.com',
  password: 'mron2393'
}

// Generate unique test data
const timestamp = Date.now()
const TEST_PILOT = {
  email: `test-pilot-${timestamp}@airniugini.com.pg`,
  password: 'TempPassword123!',
  confirmPassword: 'TempPassword123!',
  employee_id: `TEST${timestamp}`,
  first_name: 'Test',
  last_name: 'Pilot',
  rank: 'Captain',
  date_of_birth: '1980-01-01',
  phone_number: '+675 9999 9999',
  address: 'Test Address, Port Moresby'
}

console.log(`\n📧 Test Pilot Email: ${TEST_PILOT.email}`)
console.log(`🔑 Test Pilot Password: ${TEST_PILOT.password}\n`)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function completeWorkflowTest() {
  console.log('\n🚀 Starting Complete Workflow Test\n')

  let browser
  try {
    // Launch browser
    console.log('📱 Launching Chrome browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    page.on('console', msg => console.log('  [Browser]:', msg.text()))

    // ============================================
    // STEP 1: Pilot Registration
    // ============================================
    console.log('\n✅ Step 1: Pilot Registration')
    console.log('   Navigating to registration page...')
    await page.goto('http://localhost:3000/portal/register', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    console.log('   ✓ Registration page loaded')
    await sleep(3000)

    // Fill registration form
    console.log('   Filling registration form...')

    // Email
    await page.waitForSelector('input[name="email"]', { timeout: 5000 })
    await page.type('input[name="email"]', TEST_PILOT.email, { delay: 50 })
    await sleep(500)

    // Password
    await page.type('input[name="password"]', TEST_PILOT.password, { delay: 50 })
    await sleep(500)

    // Confirm Password
    await page.type('input[name="confirmPassword"]', TEST_PILOT.confirmPassword, { delay: 50 })
    await sleep(500)

    // Employee ID
    await page.type('input[name="employee_id"]', TEST_PILOT.employee_id, { delay: 50 })
    await sleep(500)

    // First Name
    await page.type('input[name="first_name"]', TEST_PILOT.first_name, { delay: 50 })
    await sleep(500)

    // Last Name
    await page.type('input[name="last_name"]', TEST_PILOT.last_name, { delay: 50 })
    await sleep(500)

    // Rank (shadcn/ui Select)
    console.log('   Selecting rank...')
    await page.click('button[role="combobox"]')
    await sleep(1500)
    await page.evaluate((rank) => {
      const options = Array.from(document.querySelectorAll('[role="option"]'))
      const captainOption = options.find(opt => opt.textContent.trim() === rank)
      if (captainOption) captainOption.click()
    }, TEST_PILOT.rank)
    await sleep(1000)

    // Date of Birth
    await page.evaluate((date) => {
      const dateInput = document.querySelector('input[name="date_of_birth"]')
      if (dateInput) {
        dateInput.value = date
        dateInput.dispatchEvent(new Event('input', { bubbles: true }))
        dateInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, TEST_PILOT.date_of_birth)
    await sleep(500)

    // Phone Number
    await page.type('input[name="phone_number"]', TEST_PILOT.phone_number, { delay: 50 })
    await sleep(500)

    // Address
    await page.type('input[name="address"]', TEST_PILOT.address, { delay: 50 })
    await sleep(1000)

    console.log('   ✓ Registration form filled')

    await page.screenshot({ path: '/tmp/workflow-01-registration-form.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-01-registration-form.png')

    // Submit registration
    console.log('   Submitting registration...')
    await page.click('button[type="submit"]')
    await sleep(5000)

    await page.screenshot({ path: '/tmp/workflow-02-registration-submitted.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-02-registration-submitted.png')

    const currentUrl = page.url()
    if (currentUrl.includes('/portal/login')) {
      console.log('   ✅ Registration submitted - redirected to login page')
    } else {
      console.log(`   ⚠️  Current URL: ${currentUrl}`)
    }

    // ============================================
    // STEP 2: Admin Approval
    // ============================================
    console.log('\n✅ Step 2: Admin Approval')
    console.log('   Navigating to admin login...')
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await sleep(3000)

    // Admin login
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await emailInput.type(ADMIN_CREDENTIALS.email, { delay: 100 })
    await sleep(1000)

    const passwordInput = await page.$('input[type="password"]')
    await passwordInput.type(ADMIN_CREDENTIALS.password, { delay: 100 })
    await sleep(1000)

    console.log('   ✓ Admin credentials entered')
    await page.click('button[type="submit"]')
    console.log('   ✓ Login button clicked')
    await sleep(5000)

    await page.screenshot({ path: '/tmp/workflow-03-admin-dashboard.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-03-admin-dashboard.png')

    // Navigate to pilot registrations
    console.log('   Navigating to pilot registrations...')
    await page.goto('http://localhost:3000/dashboard/admin/pilot-registrations', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await sleep(4000)

    await page.screenshot({ path: '/tmp/workflow-04-pending-registrations.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-04-pending-registrations.png')

    // Check for our test pilot
    const bodyText = await page.evaluate(() => document.body.textContent)
    if (bodyText.includes(TEST_PILOT.email) || bodyText.includes('Test Pilot')) {
      console.log('   ✅ Test pilot found in pending list')
    } else {
      console.log('   ⚠️  Test pilot not visible yet - may need to wait')
    }

    // Find and click approve button
    console.log('   Looking for approve button...')
    await sleep(3000)

    const approveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const approveBtn = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('approve') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('approve')
      )
      if (approveBtn) {
        approveBtn.click()
        return true
      }
      return false
    })

    if (approveClicked) {
      console.log('   ✓ Approve button clicked')
      await sleep(3000)

      // Handle confirmation dialog
      const dialogExists = await page.$('[role="dialog"], [role="alertdialog"]')
      if (dialogExists) {
        console.log('   ✓ Confirmation dialog appeared')
        await sleep(2000)

        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          const confirmBtn = buttons.find(btn =>
            btn.textContent.toLowerCase().includes('confirm') ||
            btn.textContent.toLowerCase().includes('yes') ||
            btn.textContent.toLowerCase().includes('approve')
          )
          if (confirmBtn) confirmBtn.click()
        })
        console.log('   ✓ Confirmation button clicked')
        await sleep(5000)
      }

      await page.screenshot({ path: '/tmp/workflow-05-after-approval.png' })
      console.log('   ✓ Screenshot: /tmp/workflow-05-after-approval.png')
      console.log('   ✅ Registration approved')
    } else {
      console.log('   ⚠️  No approve button found')
      await page.screenshot({ path: '/tmp/workflow-05-no-approve-button.png' })
    }

    // ============================================
    // STEP 3: Pilot Login After Approval
    // ============================================
    console.log('\n✅ Step 3: Pilot Login After Approval')
    console.log('   Logging out admin...')

    await page.goto('http://localhost:3000/api/auth/logout', {
      waitUntil: 'networkidle2'
    })
    await sleep(2000)

    // Navigate to pilot login
    console.log('   Navigating to pilot login...')
    await page.goto('http://localhost:3000/portal/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await sleep(3000)

    // Fill pilot credentials
    await page.waitForSelector('input[name="email"]', { timeout: 5000 })
    await page.type('input[name="email"]', TEST_PILOT.email, { delay: 100 })
    await sleep(1000)
    await page.type('input[name="password"]', TEST_PILOT.password, { delay: 100 })
    await sleep(1000)

    console.log('   ✓ Pilot credentials entered')

    await page.screenshot({ path: '/tmp/workflow-06-pilot-login.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-06-pilot-login.png')

    // Click login
    await page.click('button[type="submit"]')
    console.log('   ✓ Login button clicked')
    await sleep(5000)

    // Check result
    const pilotUrl = page.url()
    console.log(`   Current URL: ${pilotUrl}`)

    await page.screenshot({ path: '/tmp/workflow-07-pilot-dashboard.png' })
    console.log('   ✓ Screenshot: /tmp/workflow-07-pilot-dashboard.png')

    if (pilotUrl.includes('/portal/dashboard')) {
      console.log('   ✅ SUCCESS: Pilot logged in and redirected to dashboard!')
      console.log('   ✅ Complete workflow test PASSED!')
    } else {
      console.log('   ❌ FAILURE: Pilot login failed')

      // Check for error messages
      const errorText = await page.evaluate(() => document.body.textContent)
      if (errorText.includes('failed') || errorText.includes('error') || errorText.includes('invalid')) {
        console.log('   Error message detected on page')
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPLETE WORKFLOW TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`📧 Test Pilot: ${TEST_PILOT.email}`)
    console.log(`🆔 Employee ID: ${TEST_PILOT.employee_id}`)
    console.log('\n📸 Screenshots:')
    console.log('   1. workflow-01-registration-form.png')
    console.log('   2. workflow-02-registration-submitted.png')
    console.log('   3. workflow-03-admin-dashboard.png')
    console.log('   4. workflow-04-pending-registrations.png')
    console.log('   5. workflow-05-after-approval.png')
    console.log('   6. workflow-06-pilot-login.png')
    console.log('   7. workflow-07-pilot-dashboard.png')
    console.log('\n🎯 Workflow Complete!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('\nStack trace:', error.stack)

    if (browser) {
      const page = (await browser.pages())[0]
      if (page) {
        await page.screenshot({ path: '/tmp/workflow-error.png' })
        console.log('\n📸 Error screenshot: /tmp/workflow-error.png')
      }
    }
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...')
      await browser.close()
      console.log('✓ Browser closed\n')
    }
  }
}

// Run the test
completeWorkflowTest().catch(console.error)
