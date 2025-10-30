import { chromium } from 'playwright'

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 })
  const page = await browser.newPage()

  page.on('console', msg => console.log('BROWSER:', msg.text()))

  await page.goto('http://localhost:3000/auth/login')

  // Wait longer and see what's on the page
  await page.waitForTimeout(5000)

  // Get the page HTML
  const html = await page.content()
  console.log('Page HTML length:', html.length)

  // Check for specific elements
  const hasEmailInput = await page.locator('input[name="email"]').count()
  const hasPasswordInput = await page.locator('input[name="password"]').count()
  const hasSubmitButton = await page.locator('button[type="submit"]').count()
  const hasForm = await page.locator('form').count()

  console.log('Email input found:', hasEmailInput)
  console.log('Password input found:', hasPasswordInput)
  console.log('Submit button found:', hasSubmitButton)
  console.log('Form found:', hasForm)

  // Get all input elements
  const inputs = await page.locator('input').all()
  console.log('Total inputs:', inputs.length)

  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type')
    const name = await inputs[i].getAttribute('name')
    const id = await inputs[i].getAttribute('id')
    console.log(`Input ${i}: type=${type}, name=${name}, id=${id}`)
  }

  // Take screenshot
  await page.screenshot({ path: 'login-debug.png', fullPage: true })
  console.log('Screenshot saved')

  // Keep open for manual inspection
  await page.waitForTimeout(10000)

  await browser.close()
}

test().catch(console.error)
