import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Enable detailed logging
  page.on('console', (msg) => console.log('BROWSER:', msg.text()))
  page.on('pageerror', (error) => console.error('PAGE ERROR:', error.message))
  page.on('response', async (response) => {
    if (response.url().includes('/api/portal/register')) {
      console.log('API RESPONSE:', response.url(), response.status())
      try {
        const text = await response.text()
        console.log('API RESPONSE BODY:', text)
      } catch (e) {
        console.log('Could not read response')
      }
    }
  })

  try {
    console.log('=== PILOT REGISTRATION FIX TEST ===\n')

    const timestamp = Date.now()
    const testEmail = `test.pilot.${timestamp}@example.com`
    const testPassword = 'TestPassword123!'

    console.log('Step 1: Navigating to registration page...')
    await page.goto('http://localhost:3000/portal/register', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    })

    console.log('Step 2: Waiting for form to load...')
    await page.waitForSelector('input#first_name', { timeout: 5000 })
    await page.waitForTimeout(1000)

    console.log('Step 3: Filling out ALL required fields...')

    await page.type('input#first_name', 'Test')
    console.log('  ✓ First name')

    await page.type('input#last_name', `Pilot${timestamp}`)
    console.log('  ✓ Last name')

    await page.type('input#email', testEmail)
    console.log('  ✓ Email')

    await page.type('input#password', testPassword)
    console.log('  ✓ Password')

    await page.type('input#confirmPassword', testPassword)
    console.log('  ✓ Confirm Password')

    // Try to select rank - check if it's a select or combobox
    const selectElement = await page.$('select#rank')
    if (selectElement) {
      await page.select('select#rank', 'Captain')
      console.log('  ✓ Rank (select)')
    } else {
      // Try shadcn Select
      try {
        await page.click('button[role="combobox"]')
        await page.waitForTimeout(500)
        const captainOption = await page.$('[role="option"][data-value="Captain"]')
        if (captainOption) {
          await captainOption.click()
          console.log('  ✓ Rank (combobox)')
        }
      } catch (e) {
        console.log('  ⚠️  Could not select rank')
      }
    }

    await page.type('input#employee_id', `EMP${timestamp}`)
    console.log('  ✓ Employee ID')

    console.log('\nStep 4: Submitting form...')
    await page.click('button[type="submit"]')

    console.log('Step 5: Waiting for response...')
    await page.waitForTimeout(5000)

    const pageContent = await page.content()

    if (pageContent.includes('Registration Submitted')) {
      console.log('\n✅ SUCCESS: Registration Submitted!')
      console.log('✅ Fix worked! Registration is now working.')
    } else if (pageContent.includes('successfully')) {
      console.log('\n✅ SUCCESS: Registration successful!')
    } else if (pageContent.includes('Awaiting admin approval')) {
      console.log('\n✅ SUCCESS: Awaiting admin approval!')
    } else if (pageContent.includes('Unable to submit')) {
      console.log('\n❌ FAILED: Still getting error message')
    } else {
      console.log('\n⚠️  UNKNOWN: Check browser window')
    }

    await page.screenshot({ path: 'registration-fix-result.png', fullPage: true })
    console.log('Screenshot: registration-fix-result.png')

    console.log(`\nTest Email: ${testEmail}`)
    console.log('Browser will remain open for inspection.')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    await page.screenshot({ path: 'test-fix-error.png', fullPage: true })
  }
})()
