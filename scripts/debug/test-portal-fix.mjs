import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Enable console logging
  page.on('console', (msg) => console.log('BROWSER:', msg.text()))
  page.on('pageerror', (error) => console.error('PAGE ERROR:', error.message))

  try {
    console.log('=== Testing Pilot Portal Fix ===\n')

    console.log('Step 1: Going to pilot portal login page...')
    await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle0' })

    console.log('Step 2: Logging in as pilot (mrondeau@airniugini.com.pg)...')
    await page.waitForSelector('input#email', { timeout: 5000 })
    await page.type('input#email', 'mrondeau@airniugini.com.pg')
    await page.type('input#password', 'Lemakot@1972')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]'),
    ])

    const url = page.url()
    console.log('Step 3: Current URL after login:', url)

    if (url.includes('/portal/dashboard')) {
      console.log('✅ Login successful!\n')

      console.log('Step 4: Navigating to Leave Requests page...')
      await page.goto('http://localhost:3000/portal/leave-requests', {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      await page.waitForTimeout(3000)

      const leaveUrl = page.url()
      console.log('Step 5: Leave Requests URL:', leaveUrl)

      if (leaveUrl.includes('/portal/leave-requests')) {
        console.log('✅ Leave Requests page loaded!\n')

        // Check for error messages in the page
        const bodyText = await page.evaluate(() => document.body.innerText)

        if (bodyText.includes('Pilot account not found')) {
          console.log('❌ ERROR: Still getting "Pilot account not found" error')
        } else if (bodyText.includes('error') || bodyText.includes('Error')) {
          console.log('⚠️  WARNING: Page contains error text')
          console.log('Body preview:', bodyText.substring(0, 500))
        } else {
          console.log('✅ No "Pilot account not found" error detected!')
          console.log('✅ FIX APPEARS TO BE WORKING!\n')
        }
      } else {
        console.log('❌ Redirected away from leave requests page to:', leaveUrl)
      }
    } else {
      console.log('❌ Login failed - redirected to:', url)
    }

    console.log('\nBrowser will remain open for inspection.')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('Current URL at error:', page.url())
  }
})()
