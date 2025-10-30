#!/usr/bin/env node

import puppeteer from 'puppeteer'

const TEST_PILOT = {
  email: 'test-pilot-1761490042775@airniugini.com.pg',
  password: 'TempPassword123!'
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testLogin() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  })

  const page = await browser.newPage()

  // Clear cache and cookies
  await page.setCacheEnabled(false)
  const client = await page.createCDPSession()
  await client.send('Network.clearBrowserCookies')
  await client.send('Network.clearBrowserCache')

  console.log('\n🌐 Navigating to login page (hard refresh)...')
  await page.goto('http://localhost:3000/portal/login', {
    waitUntil: 'networkidle2'
  })

  // Force hard refresh to get latest JavaScript
  await page.reload({ waitUntil: 'networkidle2' })
  await sleep(2000)

  console.log('\n✏️  Entering credentials...')
  await page.type('input[name="email"]', TEST_PILOT.email, { delay: 50 })
  await page.type('input[name="password"]', TEST_PILOT.password, { delay: 50 })

  console.log('\n🔐 Submitting form...')
  await page.click('button[type="submit"]')

  console.log('\n⏳ Waiting for redirect...')
  await sleep(3000)

  const currentUrl = page.url()
  console.log(`\n📍 Final URL: ${currentUrl}`)

  if (currentUrl.includes('/portal/dashboard')) {
    console.log('\n✅ SUCCESS - Redirected to dashboard!')
  } else {
    console.log('\n❌ FAILED - Still on login page')
  }

  await sleep(5000)
  await browser.close()
}

testLogin().catch(console.error)
