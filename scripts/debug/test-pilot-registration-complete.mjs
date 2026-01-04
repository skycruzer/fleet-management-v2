import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Enable console and error logging
  page.on('console', (msg) => console.log('BROWSER:', msg.text()))
  page.on('pageerror', (error) => console.error('PAGE ERROR:', error.message))
  page.on('response', async (response) => {
    if (response.url().includes('/api/portal/register')) {
      console.log('API RESPONSE:', response.url(), response.status())
      if (response.status() === 200) {
        const json = await response.json()
        console.log('API SUCCESS:', JSON.stringify(json, null, 2))
      }
    }
  })

  try {
    console.log('=== PILOT REGISTRATION WORKFLOW TEST ===\n')

    // Generate unique test email
    const timestamp = Date.now()
    const testEmail = `test.pilot.${timestamp}@example.com`

    console.log('Step 1: Navigating to pilot registration page...')
    await page.goto('http://localhost:3000/portal/register', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    })

    console.log('Step 2: Waiting for registration form to load...')
    await page.waitForSelector('input#first_name', { timeout: 5000 })

    console.log('Step 3: Filling out registration form...')
    await page.type('input#first_name', 'Test')
    await page.type('input#last_name', `Pilot${timestamp}`)
    await page.type('input#email', testEmail)
    await page.type('input#password', 'TestPassword123!')

    // Select rank
    await page.select('select#rank', 'Captain')

    // Fill employee ID (optional)
    await page.type('input#employee_id', `EMP${timestamp}`)

    console.log('Step 4: Submitting registration form...')

    // Click submit and wait for response
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes('/api/portal/register') && response.status() === 200,
        { timeout: 10000 }
      ),
      page.click('button[type="submit"]'),
    ])

    console.log('Step 5: Waiting for success message...')
    await page.waitForTimeout(2000)

    // Check for success message
    const pageContent = await page.content()

    if (
      pageContent.includes('Registration Submitted') ||
      pageContent.includes('successfully') ||
      pageContent.includes('Awaiting admin approval')
    ) {
      console.log('✅ SUCCESS: Registration submitted successfully!')
      console.log('✅ SUCCESS MESSAGE displayed to pilot!')

      // Take screenshot of success state
      await page.screenshot({ path: 'registration-success.png', fullPage: true })
      console.log('Screenshot saved: registration-success.png')
    } else {
      console.log('❌ FAILED: Success message not found')
      await page.screenshot({ path: 'registration-failed.png', fullPage: true })
      console.log('Error screenshot saved: registration-failed.png')
    }

    // Wait a bit before admin check
    console.log('\nStep 6: Waiting 3 seconds before checking admin portal...')
    await page.waitForTimeout(3000)

    // ============================================
    // ADMIN PORTAL - VERIFY REGISTRATION
    // ============================================
    console.log('\n=== ADMIN PORTAL VERIFICATION ===\n')

    console.log('Step 7: Navigating to admin login...')
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' })

    console.log('Step 8: Logging in as admin...')
    await page.waitForSelector('input#email', { timeout: 5000 })

    // Clear any existing input
    await page.evaluate(() => {
      const emailInput = document.querySelector('input#email')
      const passwordInput = document.querySelector('input#password')
      if (emailInput) emailInput.value = ''
      if (passwordInput) passwordInput.value = ''
    })

    await page.type('input#email', 'skycruzer@icloud.com')
    await page.type('input#password', 'mron2393')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]'),
    ])

    const adminDashboardUrl = page.url()
    console.log('Step 9: Admin logged in, URL:', adminDashboardUrl)

    if (!adminDashboardUrl.includes('/dashboard')) {
      console.log('❌ Admin login failed - redirected to:', adminDashboardUrl)
      return
    }

    console.log('✅ Admin login successful!\n')

    console.log('Step 10: Navigating to Pilot Registrations approval page...')
    await page.goto('http://localhost:3000/dashboard/admin/pilot-registrations', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    })

    console.log('Step 11: Checking for pending registration...')
    await page.waitForTimeout(2000)

    const registrationsPageContent = await page.content()

    if (
      registrationsPageContent.includes(testEmail) ||
      registrationsPageContent.includes(`Pilot${timestamp}`)
    ) {
      console.log('✅ SUCCESS: Pending registration found in admin panel!')
      console.log(`✅ Found registration for: ${testEmail}`)

      await page.screenshot({ path: 'admin-registrations-view.png', fullPage: true })
      console.log('Screenshot saved: admin-registrations-view.png')
    } else {
      console.log('⚠️  WARNING: Pending registration not found in admin panel')
      console.log('This might be due to database permissions or RLS policies')

      await page.screenshot({ path: 'admin-registrations-notfound.png', fullPage: true })
      console.log('Screenshot saved: admin-registrations-notfound.png')
    }

    console.log('\n=== TEST COMPLETE ===')
    console.log('\nSummary:')
    console.log(`- Test Email: ${testEmail}`)
    console.log(`- Employee ID: EMP${timestamp}`)
    console.log('- Registration form submission: Check logs above')
    console.log('- Success message display: Check logs above')
    console.log('- Admin can view registration: Check logs above')
    console.log('\nBrowser will remain open for manual inspection.')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('Current URL at error:', page.url())
    await page.screenshot({ path: 'test-error.png', fullPage: true })
    console.log('Error screenshot saved: test-error.png')
  }
})()
