/**
 * Pilot Portal Screenshot Testing Script
 * Takes screenshots of every page to verify actual UI state
 */

import puppeteer from 'puppeteer'
import fs from 'fs'

const TEST_EMAIL = 'mrondeau@airniugini.com.pg'
const TEST_PASSWORD = 'Lemakot@1972'
const BASE_URL = 'http://localhost:3000'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Create screenshots directory
if (!fs.existsSync('./screenshots')) {
  fs.mkdirSync('./screenshots')
}

async function testPilotPortal() {
  console.log('📸 Starting Pilot Portal Screenshot Testing...\n')
  console.log('=' .repeat(80))

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1920,1080'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  try {
    // ============================================================================
    // LOGIN
    // ============================================================================
    console.log('\n🔐 Logging in...')
    await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' })
    await page.screenshot({ path: './screenshots/1-login-page.png', fullPage: true })
    console.log('  ✓ Screenshot: 1-login-page.png')

    await page.type('input[type="email"]', TEST_EMAIL, { delay: 50 })
    await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 })
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    await sleep(3000) // Extra time for data to load

    await page.screenshot({ path: './screenshots/2-dashboard.png', fullPage: true })
    console.log('  ✓ Screenshot: 2-dashboard.png')
    console.log(`  ✓ Current URL: ${page.url()}`)

    // ============================================================================
    // PROFILE PAGE
    // ============================================================================
    console.log('\n👤 Testing Profile Page...')
    await page.click('a[href="/portal/profile"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await sleep(3000) // Wait for data to load

    await page.screenshot({ path: './screenshots/3-profile.png', fullPage: true })
    console.log('  ✓ Screenshot: 3-profile.png')
    console.log(`  ✓ Current URL: ${page.url()}`)

    // Check for actual data on page
    const profileData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasName: text.includes('Name') || text.includes('name'),
        hasEmail: text.includes('Email') || text.includes('email'),
        hasRank: text.includes('Rank') || text.includes('rank'),
        hasEmployeeId: text.includes('Employee') || text.includes('employee'),
        hasUnauthorized: text.includes('Unauthorized') || text.includes('401'),
        hasError: text.includes('Error') || text.includes('error'),
        hasLoading: text.includes('Loading') || text.includes('loading'),
      }
    })
    console.log('  📊 Profile page content:', profileData)

    // ============================================================================
    // CERTIFICATIONS PAGE
    // ============================================================================
    console.log('\n🎓 Testing Certifications Page...')
    await page.click('a[href="/portal/certifications"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await sleep(3000)

    await page.screenshot({ path: './screenshots/4-certifications.png', fullPage: true })
    console.log('  ✓ Screenshot: 4-certifications.png')
    console.log(`  ✓ Current URL: ${page.url()}`)

    const certData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasCertification: text.includes('Certification') || text.includes('certification'),
        hasTable: document.querySelector('table') !== null,
        hasCards: document.querySelectorAll('[class*="card"]').length,
        hasUnauthorized: text.includes('Unauthorized') || text.includes('401'),
        hasNoCerts: text.includes('No certifications') || text.includes('no certifications'),
        rowCount: document.querySelectorAll('table tr').length,
      }
    })
    console.log('  📊 Certifications page content:', certData)

    // ============================================================================
    // LEAVE REQUESTS PAGE
    // ============================================================================
    console.log('\n🏖️  Testing Leave Requests Page...')
    await page.click('a[href="/portal/leave-requests"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await sleep(3000)

    await page.screenshot({ path: './screenshots/5-leave-requests.png', fullPage: true })
    console.log('  ✓ Screenshot: 5-leave-requests.png')
    console.log(`  ✓ Current URL: ${page.url()}`)

    const leaveData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasLeave: text.includes('Leave') || text.includes('leave'),
        hasRequest: text.includes('Request') || text.includes('request'),
        hasTable: document.querySelector('table') !== null,
        hasUnauthorized: text.includes('Unauthorized') || text.includes('401'),
        hasNoRequests: text.includes('No leave requests') || text.includes('no requests'),
        hasButton: document.querySelector('button') !== null,
      }
    })
    console.log('  📊 Leave Requests page content:', leaveData)

    // ============================================================================
    // FLIGHT REQUESTS PAGE
    // ============================================================================
    console.log('\n✈️  Testing Flight Requests Page...')
    await page.click('a[href="/portal/flight-requests"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    await sleep(3000)

    await page.screenshot({ path: './screenshots/6-flight-requests.png', fullPage: true })
    console.log('  ✓ Screenshot: 6-flight-requests.png')
    console.log(`  ✓ Current URL: ${page.url()}`)

    const flightData = await page.evaluate(() => {
      const text = document.body.innerText
      return {
        hasFlight: text.includes('Flight') || text.includes('flight'),
        hasRequest: text.includes('Request') || text.includes('request'),
        hasTable: document.querySelector('table') !== null,
        hasUnauthorized: text.includes('Unauthorized') || text.includes('401'),
        hasNoRequests: text.includes('No flight requests') || text.includes('no requests'),
        hasForm: document.querySelector('form') !== null,
      }
    })
    console.log('  📊 Flight Requests page content:', flightData)

    // ============================================================================
    // FEEDBACK PAGE
    // ============================================================================
    console.log('\n💬 Testing Feedback Page...')
    const feedbackLink = await page.$('a[href="/portal/feedback"]')
    if (feedbackLink) {
      await page.click('a[href="/portal/feedback"]')
      await page.waitForNavigation({ waitUntil: 'networkidle2' })
      await sleep(2000)

      await page.screenshot({ path: './screenshots/7-feedback.png', fullPage: true })
      console.log('  ✓ Screenshot: 7-feedback.png')
      console.log(`  ✓ Current URL: ${page.url()}`)
    } else {
      console.log('  ⏭️  Feedback link not found')
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ All screenshots saved to ./screenshots/ directory')
    console.log('='.repeat(80))
    console.log('\n📂 Screenshots created:')
    const files = fs.readdirSync('./screenshots')
    files.forEach(file => console.log(`  - ${file}`))

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error(error)
    await page.screenshot({ path: './screenshots/error.png', fullPage: true })
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for review...')
    await sleep(10000)
    await browser.close()
    console.log('✅ Browser closed.')
  }
}

testPilotPortal().catch(console.error)
