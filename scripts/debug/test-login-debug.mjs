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
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  })

  const page = await browser.newPage()

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`\n🔴 PAGE ERROR: ${error.message}`)
  })

  // Capture failed requests
  page.on('requestfailed', (request) => {
    console.log(`\n❌ REQUEST FAILED: ${request.url()}`)
    console.log(`   Failure: ${request.failure().errorText}`)
  })

  // Capture network activity
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/portal/login')) {
      console.log(`\n📤 REQUEST: POST /api/portal/login`)
      requests.push(request)
    }
  })

  page.on('response', async (response) => {
    if (response.url().includes('/api/portal/login')) {
      console.log(`\n📥 RESPONSE: ${response.status()} ${response.statusText()}`)
      try {
        const json = await response.json()
        console.log('Body:', JSON.stringify(json, null, 2))
      } catch (e) {}
    }
  })

  await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle2' })
  await sleep(2000)

  console.log('\n✏️  Filling form...')
  await page.type('input[name="email"]', TEST_PILOT.email, { delay: 50 })
  await page.type('input[name="password"]', TEST_PILOT.password, { delay: 50 })

  console.log('\n🔐 Clicking submit...')
  await page.click('button[type="submit"]')

  console.log('\n⏳ Waiting for network activity...')
  await sleep(5000)

  const url = page.url()
  console.log(`\n📍 Current URL: ${url}`)
  console.log(`📊 Total /api/portal/login requests: ${requests.length}`)

  if (url.includes('/portal/dashboard')) {
    console.log('\n✅ SUCCESS - Redirected to dashboard!')
  } else {
    console.log('\n❌ FAILED - Still on login page')

    // Check for visible error
    const errorVisible = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('*')).filter(
        (el) =>
          el.textContent.toLowerCase().includes('error') ||
          el.textContent.toLowerCase().includes('invalid')
      )
      return errors.map((el) => el.textContent.trim()).filter((t) => t.length < 200)
    })

    if (errorVisible.length > 0) {
      console.log('\n🔴 Error messages found:')
      errorVisible.forEach((msg) => console.log(`   - ${msg}`))
    }
  }

  await sleep(10000)
  await browser.close()
}

testLogin().catch(console.error)
