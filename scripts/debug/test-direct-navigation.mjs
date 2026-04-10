import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  console.log('Testing direct navigation to leave bid review page...')

  try {
    await page.goto('http://localhost:3000/dashboard/admin/leave-bids', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    })

    const url = page.url()
    console.log('Current URL:', url)

    if (url.includes('/dashboard/admin/leave-bids')) {
      console.log('✅ SUCCESS: Page loaded correctly!')
    } else {
      console.log('❌ REDIRECT: Page redirected to:', url)
    }

    console.log('\nBrowser will remain open for inspection.')
  } catch (error) {
    console.error('Navigation failed:', error.message)
  }
})()
