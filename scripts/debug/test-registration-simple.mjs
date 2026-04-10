import puppeteer from 'puppeteer'
;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Monitor API responses
  page.on('response', async (response) => {
    if (response.url().includes('/api/portal/register')) {
      console.log('\n=== API RESPONSE ===')
      console.log('URL:', response.url())
      console.log('Status:', response.status())
      try {
        const text = await response.text()
        console.log('Body:', text)
      } catch (e) {
        // Ignore
      }
    }
  })

  console.log('=== PILOT REGISTRATION TEST ===\n')
  console.log('Opening http://localhost:3000/portal/register\n')
  console.log('Please manually:')
  console.log('1. Fill out the form')
  console.log('2. Click Register button')
  console.log('3. Check if success message appears\n')
  console.log('Browser will remain open for testing...\n')

  await page.goto('http://localhost:3000/portal/register', {
    waitUntil: 'networkidle0',
  })
})()
