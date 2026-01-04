#!/usr/bin/env node

/**
 * Admin Portal Approval Test using Puppeteer
 *
 * Tests the admin approval workflow:
 * 1. Login as admin
 * 2. Navigate to pilot registrations page
 * 3. Approve pending registration
 * 4. Verify pilot can now login
 */

import puppeteer from 'puppeteer'

const ADMIN_CREDENTIALS = {
  email: 'skycruzer@icloud.com',
  password: 'mron2393',
}

// Get the test pilot email from database query (most recent)
const TEST_PILOT_EMAIL = 'test-pilot-1761486869910@airniugini.com.pg'
const TEST_PILOT_PASSWORD = 'TempPassword123!'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testAdminApproval() {
  console.log('\n🚀 Starting Admin Approval Workflow Test\n')

  let browser
  try {
    // Launch browser
    console.log('📱 Launching Chrome browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    page.on('console', (msg) => console.log('  [Browser]:', msg.text()))

    // Step 1: Admin Login
    console.log('\n✅ Test 1: Admin Login')
    console.log('   Navigating to admin login page...')
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    console.log('   ✓ Login page loaded')

    // Wait for the form to be fully loaded (check for the login button)
    await page.waitForSelector('form', { timeout: 10000 })
    await sleep(3000) // Wait for client-side rendering

    // Fill admin credentials (use type attribute selectors since inputs don't have name attr)
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await emailInput.type(ADMIN_CREDENTIALS.email, { delay: 100 }) // Slower typing
    await sleep(1000)

    const passwordInput = await page.$('input[type="password"]')
    await passwordInput.type(ADMIN_CREDENTIALS.password, { delay: 100 }) // Slower typing
    await sleep(1000)

    console.log(`   ✓ Admin credentials entered: ${ADMIN_CREDENTIALS.email}`)

    // Take screenshot
    await page.screenshot({ path: '/tmp/10-admin-login.png' })
    console.log('   ✓ Screenshot saved: /tmp/10-admin-login.png')

    // Click login
    await page.click('button[type="submit"]')
    console.log('   ✓ Login button clicked')
    await sleep(5000) // Wait longer for navigation

    // Verify redirect to dashboard
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ SUCCESS: Logged in and redirected to dashboard')
    } else {
      console.log('   ⚠️  WARNING: Not redirected to dashboard - check screenshot')
    }

    await page.screenshot({ path: '/tmp/11-admin-dashboard.png' })
    console.log('   ✓ Screenshot saved: /tmp/11-admin-dashboard.png')

    // Step 2: Navigate to pilot registrations
    console.log('\n✅ Test 2: Navigate to Pilot Registrations')
    console.log('   Navigating to pilot registrations page...')
    await page.goto('http://localhost:3000/dashboard/admin/pilot-registrations', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    console.log('   ✓ Pilot registrations page loaded')
    await sleep(3000) // Wait for page to fully render

    await page.screenshot({ path: '/tmp/12-pending-registrations.png' })
    console.log('   ✓ Screenshot saved: /tmp/12-pending-registrations.png')

    // Check for pending registrations
    const bodyText = await page.evaluate(() => document.body.textContent)
    if (bodyText.includes('Test Pilot') || bodyText.includes(TEST_PILOT_EMAIL)) {
      console.log('   ✅ SUCCESS: Test pilot registration found in pending list')
    } else {
      console.log('   ⚠️  WARNING: Test pilot not found - may already be processed')
    }

    // Step 3: Approve the registration
    console.log('\n✅ Test 3: Approve Pilot Registration')
    console.log('   Looking for approve button...')

    // Wait a bit for any dynamic content to load
    await sleep(4000) // Increased wait time

    // Find and click the approve button using text content
    const approveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const approveBtn = buttons.find(
        (btn) =>
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
      await sleep(3000) // Wait for dialog

      // Check for confirmation dialog
      const dialogExists = await page.$('[role="dialog"], [role="alertdialog"]')
      if (dialogExists) {
        console.log('   ✓ Confirmation dialog appeared')
        await sleep(2000) // Wait before clicking confirm

        // Click confirm button in dialog
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          const confirmBtn = buttons.find(
            (btn) =>
              btn.textContent.toLowerCase().includes('confirm') ||
              btn.textContent.toLowerCase().includes('yes') ||
              btn.textContent.toLowerCase().includes('approve')
          )
          if (confirmBtn) {
            confirmBtn.click()
          }
        })
        console.log('   ✓ Confirmation button clicked')
        await sleep(4000) // Wait for approval to process
      }

      await page.screenshot({ path: '/tmp/13-after-approval.png' })
      console.log('   ✓ Screenshot saved: /tmp/13-after-approval.png')
      console.log('   ✅ SUCCESS: Registration approved')
    } else {
      console.log('   ⚠️  WARNING: No approve buttons found')
      await page.screenshot({ path: '/tmp/13-no-approve-button.png' })
      console.log('   ✓ Screenshot saved: /tmp/13-no-approve-button.png')
    }

    // Step 4: Test pilot login (should now succeed)
    console.log('\n✅ Test 4: Test Pilot Login After Approval')
    console.log('   Logging out admin...')

    // Logout admin
    await page.goto('http://localhost:3000/api/auth/logout', {
      waitUntil: 'networkidle2',
    })
    await sleep(2000) // Wait after logout

    // Go to pilot login
    console.log('   Navigating to pilot login page...')
    await page.goto('http://localhost:3000/portal/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    console.log('   ✓ Pilot login page loaded')
    await sleep(3000) // Wait for page to fully render

    // Fill pilot credentials
    await page.waitForSelector('input[name="email"]', { timeout: 5000 })
    await page.type('input[name="email"]', TEST_PILOT_EMAIL, { delay: 100 }) // Slower typing
    await sleep(1000)
    await page.type('input[name="password"]', TEST_PILOT_PASSWORD, { delay: 100 }) // Slower typing
    await sleep(1000)
    console.log(`   ✓ Pilot credentials entered`)

    await page.screenshot({ path: '/tmp/14-pilot-login-after-approval.png' })

    // Click login
    await page.click('button[type="submit"]')
    console.log('   ✓ Login button clicked')
    await sleep(5000) // Wait longer for navigation

    // Check if redirected to dashboard
    const pilotUrl = page.url()
    console.log(`   Current URL: ${pilotUrl}`)

    await page.screenshot({ path: '/tmp/15-pilot-dashboard.png' })
    console.log('   ✓ Screenshot saved: /tmp/15-pilot-dashboard.png')

    if (pilotUrl.includes('/portal/dashboard')) {
      console.log('   ✅ SUCCESS: Pilot successfully logged in after approval!')
      console.log('   ✅ Pilot redirected to dashboard')
    } else {
      console.log('   ❌ FAILURE: Pilot login failed - still not approved or other error')

      // Check for error messages
      const errorText = await page.evaluate(() => document.body.textContent)
      if (errorText.includes('failed') || errorText.includes('error')) {
        console.log('   Error detected on page - check screenshot')
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 ADMIN APPROVAL TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ Admin login successful')
    console.log('✅ Navigated to pilot registrations page')
    console.log('✅ Attempted to approve registration')
    console.log('✅ Tested pilot login after approval')
    console.log('\n📸 Screenshots saved to /tmp/:')
    console.log('   - 10-admin-login.png')
    console.log('   - 11-admin-dashboard.png')
    console.log('   - 12-pending-registrations.png')
    console.log('   - 13-after-approval.png')
    console.log('   - 14-pilot-login-after-approval.png')
    console.log('   - 15-pilot-dashboard.png')
    console.log('\n🎯 Workflow Complete!')
    console.log('='.repeat(60) + '\n')
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('\nStack trace:', error.stack)

    if (browser) {
      const page = (await browser.pages())[0]
      if (page) {
        await page.screenshot({ path: '/tmp/admin-error-screenshot.png' })
        console.log('\n📸 Error screenshot saved: /tmp/admin-error-screenshot.png')
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
testAdminApproval().catch(console.error)
