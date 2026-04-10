#!/usr/bin/env node

import puppeteer from 'puppeteer'

const TEST_PILOT = {
  email: 'test-pilot-1761490042775@airniugini.com.pg',
  password: 'TempPassword123!',
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testLogin() {
  let browser

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
    })

    const page = await browser.newPage()

    // Capture ALL console messages
    const consoleLogs = []
    page.on('console', (msg) => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      console.log(`  [Browser ${msg.type()}]: ${text}`)
    })

    // Capture network requests
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/portal/login')) {
        const status = response.status()
        console.log(`\n📡 API Response: ${status}`)
        try {
          const body = await response.json()
          console.log('Response body:', JSON.stringify(body, null, 2))
        } catch (e) {
          // Ignore parsing errors
        }
      }
    })

    console.log('\n🌐 Navigating to login page...')
    await page.goto('http://localhost:3000/portal/login', {
      waitUntil: 'networkidle2',
    })
    await sleep(2000)

    console.log('\n✏️  Entering credentials...')
    await page.type('input[name="email"]', TEST_PILOT.email, { delay: 50 })
    await page.type('input[name="password"]', TEST_PILOT.password, { delay: 50 })
    await sleep(500)

    console.log('\n🔐 Submitting form...')
    await page.click('button[type="submit"]')

    console.log('\n⏳ Waiting 5 seconds for response...')
    await sleep(5000)

    const currentUrl = page.url()
    console.log(`\n📍 Final URL: ${currentUrl}`)

    // Check for error messages in the page
    const pageContent = await page.content()
    const hasError =
      pageContent.toLowerCase().includes('error') || pageContent.toLowerCase().includes('invalid')

    if (hasError) {
      console.log('\n❌ Error detected in page content')

      // Try to find the error message element
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('[role="alert"], .text-red-600, .text-red-700')
        return errorEl ? errorEl.textContent : null
      })

      if (errorText) {
        console.log('Error message:', errorText)
      }
    }

    console.log('\n📋 Console logs:')
    consoleLogs.forEach((log) => console.log(log))

    await page.screenshot({ path: '/tmp/detailed-login-result.png' })
    console.log('\n📸 Screenshot: /tmp/detailed-login-result.png')

    if (currentUrl.includes('/portal/dashboard')) {
      console.log('\n✅ SUCCESS!')
    } else {
      console.log('\n❌ Did not redirect to dashboard')
    }

    console.log('\n⏰ Keeping browser open for 10 seconds...')
    await sleep(10000)
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

testLogin()
