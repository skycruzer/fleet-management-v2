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
    console.log('=== PILOT PORTAL BUTTON TESTING ===\n')

    // ============================================
    // STEP 1: LOGIN TO PILOT PORTAL
    // ============================================
    console.log('Step 1: Logging in to pilot portal...')
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

    // ============================================
    // STEP 2: TEST LEAVE REQUESTS PAGE
    // ============================================
    console.log('Step 2: Testing Leave Requests page...')
    await page.goto('http://localhost:3000/portal/leave-requests', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    })

    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'leave-requests-page.png', fullPage: true })
    console.log('Screenshot saved: leave-requests-page.png')

    // Look for "Submit Leave Request" or "New Leave Request" button
    const leaveRequestButtons = await page.$$eval('button, a', (elements) => {
      return elements
        .map((el) => ({
          text: el.textContent?.trim() || '',
          tag: el.tagName,
          type: el.getAttribute('type'),
          disabled: el.hasAttribute('disabled'),
        }))
        .filter(
          (el) =>
            el.text.toLowerCase().includes('leave request') ||
            el.text.toLowerCase().includes('submit') ||
            el.text.toLowerCase().includes('new')
        )
    })

    console.log('\nFound buttons on Leave Requests page:')
    leaveRequestButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.text} (${btn.tag}${btn.disabled ? ' - DISABLED' : ''})`)
    })

    // ============================================
    // STEP 3: TEST LEAVE BID PAGE
    // ============================================
    console.log('\nStep 3: Navigating to Leave Bids page...')

    // Try to find leave bids link in navigation
    const navLinks = await page.$$eval('nav a, aside a, [role="navigation"] a', (links) => {
      return links.map((link) => ({
        text: link.textContent?.trim() || '',
        href: link.getAttribute('href') || '',
      }))
    })

    console.log('\nNavigation links found:')
    navLinks.forEach((link, i) => {
      if (link.text) {
        console.log(`  ${i + 1}. ${link.text} → ${link.href}`)
      }
    })

    // Try to navigate to leave bids if the link exists
    const leaveBidLink = navLinks.find(
      (link) => link.text.toLowerCase().includes('leave bid') || link.href.includes('leave-bid')
    )

    if (leaveBidLink) {
      console.log(`\nFound Leave Bids link: ${leaveBidLink.text}`)
      await page.goto(`http://localhost:3000${leaveBidLink.href}`, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      })

      await page.waitForTimeout(2000)

      // Take screenshot
      await page.screenshot({ path: 'leave-bids-page.png', fullPage: true })
      console.log('Screenshot saved: leave-bids-page.png')

      // Look for "Submit Leave Bid" button
      const leaveBidButtons = await page.$$eval('button, a', (elements) => {
        return elements
          .map((el) => ({
            text: el.textContent?.trim() || '',
            tag: el.tagName,
            type: el.getAttribute('type'),
            disabled: el.hasAttribute('disabled'),
          }))
          .filter(
            (el) =>
              el.text.toLowerCase().includes('leave bid') ||
              el.text.toLowerCase().includes('submit') ||
              el.text.toLowerCase().includes('new')
          )
      })

      console.log('\nFound buttons on Leave Bids page:')
      leaveBidButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. ${btn.text} (${btn.tag}${btn.disabled ? ' - DISABLED' : ''})`)
      })
    } else {
      console.log('⚠️  Could not find Leave Bids navigation link.')
      console.log('   This feature may not be implemented yet.')
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n=== TEST SUMMARY ===')
    console.log('1. Login: ✅ SUCCESS')
    console.log('2. Leave Requests page: ✅ LOADED')
    console.log(
      `3. Leave Requests buttons: ${leaveRequestButtons.length > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`
    )
    console.log(`4. Leave Bids page: ${leaveBidLink ? '✅ FOUND' : '⚠️  NOT FOUND'}`)

    console.log('\nBrowser will remain open for manual inspection.')
    console.log('Please check:')
    console.log('- Can you click "Submit Leave Request" button?')
    console.log('- Can you click "Submit Leave Bid" button?')
    console.log('- Do the buttons open the submission forms?')
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('Current URL at error:', page.url())
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
    console.log('Error screenshot saved: error-screenshot.png')
  }
})()
