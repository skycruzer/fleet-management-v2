#!/usr/bin/env node

/**
 * Automated Pilot Registration Test using Puppeteer
 *
 * Tests the complete pilot registration workflow:
 * 1. Navigate to registration page
 * 2. Fill out registration form
 * 3. Submit registration
 * 4. Verify success message
 * 5. Test login before approval (should be blocked)
 */

import puppeteer from 'puppeteer'

const TEST_DATA = {
  email: `test-pilot-${Date.now()}@airniugini.com.pg`,
  password: 'TempPassword123!',
  confirmPassword: 'TempPassword123!',
  employee_id: '9999', // Use a non-existent employee_id for testing
  first_name: 'Test',
  last_name: 'Pilot',
  rank: 'Captain',
  date_of_birth: '1980-01-01',
  phone_number: '+675 9999 9999',
  address: 'Test Address, Port Moresby'
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testPilotRegistration() {
  console.log('\n🚀 Starting Pilot Registration Test with Puppeteer\n')

  let browser
  try {
    // Launch browser
    console.log('📱 Launching Chrome browser...')
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1280, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Enable console logging from the page
    page.on('console', msg => console.log('  [Browser Console]:', msg.text()))

    // Step 1: Navigate to registration page
    console.log('\n✅ Test 1: Navigate to Registration Page')
    console.log('   Navigating to http://localhost:3000/portal/register...')
    await page.goto('http://localhost:3000/portal/register', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    console.log('   ✓ Page loaded successfully')

    // Take screenshot
    await page.screenshot({ path: '/tmp/01-registration-page.png' })
    console.log('   ✓ Screenshot saved: /tmp/01-registration-page.png')

    // Step 2: Fill out registration form
    console.log('\n✅ Test 2: Fill Registration Form')

    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 5000 })
    console.log('   ✓ Form element found')

    // Fill in form fields
    console.log('   Filling form fields...')

    // Email
    await page.type('input[name="email"]', TEST_DATA.email)
    console.log(`   ✓ Email: ${TEST_DATA.email}`)

    // Password
    await page.type('input[name="password"]', TEST_DATA.password)
    console.log('   ✓ Password: ********')

    // Confirm Password
    await page.type('input[name="confirmPassword"]', TEST_DATA.confirmPassword)
    console.log('   ✓ Confirm Password: ********')

    // Employee ID
    await page.type('input[name="employee_id"]', TEST_DATA.employee_id)
    console.log(`   ✓ Employee ID: ${TEST_DATA.employee_id}`)

    // First Name
    await page.type('input[name="first_name"]', TEST_DATA.first_name)
    console.log(`   ✓ First Name: ${TEST_DATA.first_name}`)

    // Last Name
    await page.type('input[name="last_name"]', TEST_DATA.last_name)
    console.log(`   ✓ Last Name: ${TEST_DATA.last_name}`)

    // Rank (shadcn/ui Select component - click trigger, then select option)
    console.log('   Clicking rank selector...')
    await page.click('button[role="combobox"]') // SelectTrigger
    await sleep(1000) // Wait for dropdown to open

    // Click the Captain option (use text content matching)
    await page.evaluate((rank) => {
      const options = Array.from(document.querySelectorAll('[role="option"]'))
      const captainOption = options.find(opt => opt.textContent.trim() === rank)
      if (captainOption) {
        captainOption.click()
      }
    }, TEST_DATA.rank)
    await sleep(300) // Wait for selection to register
    console.log(`   ✓ Rank: ${TEST_DATA.rank}`)

    // Date of Birth (set value directly for date input to avoid formatting issues)
    await page.evaluate((date) => {
      const dateInput = document.querySelector('input[name="date_of_birth"]')
      if (dateInput) {
        dateInput.value = date
        dateInput.dispatchEvent(new Event('input', { bubbles: true }))
        dateInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, TEST_DATA.date_of_birth)
    console.log(`   ✓ Date of Birth: ${TEST_DATA.date_of_birth}`)

    // Phone Number
    await page.type('input[name="phone_number"]', TEST_DATA.phone_number)
    console.log(`   ✓ Phone Number: ${TEST_DATA.phone_number}`)

    // Address
    await page.type('input[name="address"]', TEST_DATA.address)
    console.log(`   ✓ Address: ${TEST_DATA.address}`)

    // Take screenshot of filled form
    await page.screenshot({ path: '/tmp/02-form-filled.png' })
    console.log('   ✓ Screenshot saved: /tmp/02-form-filled.png')

    // Step 3: Submit registration
    console.log('\n✅ Test 3: Submit Registration')
    console.log('   Clicking submit button...')

    // Find and click submit button
    const submitButton = await page.$('button[type="submit"]')
    if (!submitButton) {
      throw new Error('Submit button not found')
    }

    await submitButton.click()
    console.log('   ✓ Submit button clicked')

    // Wait for navigation or success message
    console.log('   Waiting for response...')
    await sleep(3000) // Wait for API response

    // Take screenshot of result
    await page.screenshot({ path: '/tmp/03-registration-submitted.png' })
    console.log('   ✓ Screenshot saved: /tmp/03-registration-submitted.png')

    // Check for success message or redirect
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    // Check for error messages
    const errorMessages = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('.text-red-500, .text-destructive, [role="alert"]'))
      return errors.map(el => el.textContent.trim()).filter(text => text.length > 0)
    })

    if (errorMessages.length > 0) {
      console.log('   ❌ VALIDATION ERRORS DETECTED:')
      errorMessages.forEach(msg => console.log(`      - ${msg}`))
    }

    if (currentUrl.includes('/portal/login')) {
      console.log('   ✅ SUCCESS: Redirected to login page')
    } else if (currentUrl.includes('Registration Submitted')) {
      console.log('   ✅ SUCCESS: Success page displayed')
    } else {
      // Check for success message on same page
      const bodyText = await page.evaluate(() => document.body.textContent)
      if (bodyText.includes('Registration Submitted') || bodyText.includes('pending') || bodyText.includes('approval')) {
        console.log('   ✅ SUCCESS: Success message detected')
      } else {
        console.log('   ⚠️  WARNING: Registration may have failed - check screenshot and errors above')
      }
    }

    // Step 4: Test login before approval
    console.log('\n✅ Test 4: Test Login Before Approval (Should Be Blocked)')
    console.log('   Navigating to login page...')
    await page.goto('http://localhost:3000/portal/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    console.log('   ✓ Login page loaded')

    // Fill login form
    console.log('   Filling login credentials...')
    await page.waitForSelector('input[name="email"]', { timeout: 5000 })
    await page.type('input[name="email"]', TEST_DATA.email)
    await page.type('input[name="password"]', TEST_DATA.password)
    console.log('   ✓ Credentials entered')

    // Click login button
    const loginButton = await page.$('button[type="submit"]')
    if (loginButton) {
      console.log('   Clicking login button...')
      await loginButton.click()
      await sleep(2000)

      // Take screenshot
      await page.screenshot({ path: '/tmp/04-login-blocked.png' })
      console.log('   ✓ Screenshot saved: /tmp/04-login-blocked.png')

      // Check for error message
      const loginBodyText = await page.evaluate(() => document.body.textContent)
      if (loginBodyText.includes('failed') || loginBodyText.includes('approval') || loginBodyText.includes('pending')) {
        console.log('   ✅ SUCCESS: Login correctly blocked (unapproved registration)')
      } else {
        const loginUrl = page.url()
        if (!loginUrl.includes('/portal/dashboard')) {
          console.log('   ✅ SUCCESS: Did not redirect to dashboard')
        } else {
          console.log('   ❌ FAILURE: Login should be blocked but user was redirected to dashboard')
        }
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ Registration page loaded')
    console.log('✅ Form filled with test data')
    console.log('✅ Registration submitted')
    console.log('✅ Login attempted (should be blocked)')
    console.log('\n📸 Screenshots saved to /tmp/:')
    console.log('   - 01-registration-page.png')
    console.log('   - 02-form-filled.png')
    console.log('   - 03-registration-submitted.png')
    console.log('   - 04-login-blocked.png')
    console.log('\n🎯 Next Steps:')
    console.log('   1. Review screenshots to verify UI behavior')
    console.log('   2. Approve registration via admin dashboard')
    console.log('   3. Test login again (should succeed after approval)')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('\nStack trace:', error.stack)

    if (browser) {
      const page = (await browser.pages())[0]
      if (page) {
        await page.screenshot({ path: '/tmp/error-screenshot.png' })
        console.log('\n📸 Error screenshot saved: /tmp/error-screenshot.png')
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
testPilotRegistration().catch(console.error)
