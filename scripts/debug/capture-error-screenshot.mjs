import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  console.log('Connecting to existing registration page...')
  console.log('Navigating to http://localhost:3000/portal/register')

  await page.goto('http://localhost:3000/portal/register', {
    waitUntil: 'networkidle0',
  })

  await page.waitForTimeout(2000)

  console.log('\nCapturing current state screenshot...')
  await page.screenshot({ path: 'registration-error-current-state.png', fullPage: true })
  console.log('Screenshot saved: registration-error-current-state.png')

  // Check for any error messages on the page
  const pageContent = await page.content()

  if (pageContent.includes('Unable to submit')) {
    console.log('\n❌ ERROR FOUND: "Unable to submit registration" message')
  }

  if (pageContent.includes('Date of birth must be')) {
    console.log('❌ ERROR FOUND: Date of birth validation error')
  }

  if (pageContent.includes('must be between 18 and 100')) {
    console.log('❌ ERROR FOUND: Age validation error')
  }

  console.log('\nBrowser will remain open for inspection.')
  console.log('Check the screenshot: registration-error-current-state.png')
})()
