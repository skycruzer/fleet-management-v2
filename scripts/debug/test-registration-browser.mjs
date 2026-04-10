import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  console.log('=== PILOT REGISTRATION PAGE ===')
  console.log('\nOpening registration page at: http://localhost:3000/portal/register')
  console.log('\nPlease manually fill out and submit the form to test registration.')
  console.log('The form has all required fields:')
  console.log('  - First Name')
  console.log('  - Last Name')
  console.log('  - Rank (shadcn/ui Select)')
  console.log('  - Employee ID (optional)')
  console.log('  - Email')
  console.log('  - Password')
  console.log('  - Confirm Password')
  console.log('\nBrowser will remain open for manual testing.')

  await page.goto('http://localhost:3000/portal/register', {
    waitUntil: 'networkidle0',
  })
})()
