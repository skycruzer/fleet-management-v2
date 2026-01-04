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
    console.log('=== PILOT PORTAL COMPLETE TEST ===\n')

    // Step 1: Login to pilot portal
    console.log('Step 1: Going to pilot portal login...')
    await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle0' })

    await page.waitForSelector('input#email', { timeout: 5000 })
    await page.type('input#email', 'mrondeau@airniugini.com.pg')
    await page.type('input#password', 'Lemakot@1972')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.click('button[type="submit"]'),
    ])

    const dashboardUrl = page.url()
    if (!dashboardUrl.includes('/portal/dashboard')) {
      console.log('❌ Login failed - redirected to:', dashboardUrl)
      return
    }
    console.log('✅ Login successful!\n')

    // Step 2: Test Leave Requests page
    console.log('Step 2: Testing Leave Requests page...')
    await page.goto('http://localhost:3000/portal/leave-requests', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    })

    // Wait for the page to fully load
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const bodyText = await page.evaluate(() => document.body.innerText)

    if (bodyText.includes('Pilot account not found')) {
      console.log('❌ ERROR: "Pilot account not found" error still present')
    } else {
      console.log('✅ Leave Requests page loaded without errors!')

      // Check if leave requests are displayed
      if (bodyText.includes('Leave Request') || bodyText.includes('No leave requests')) {
        console.log('✅ Leave requests data is accessible!')
      }
    }

    console.log('\n=== TEST SUMMARY ===')
    console.log('1. Pilot Login: ✅ SUCCESS')
    console.log('2. Leave Requests Page: ✅ LOADED')
    console.log(
      '3. "Pilot account not found" error: ' +
        (bodyText.includes('Pilot account not found') ? '❌ STILL PRESENT' : '✅ FIXED')
    )

    console.log('\nBrowser will remain open for manual inspection.')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('Current URL at error:', page.url())
  }
})()
