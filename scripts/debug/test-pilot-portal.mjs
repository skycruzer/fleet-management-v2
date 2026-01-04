#!/usr/bin/env node

import puppeteer from 'puppeteer'

/**
 * Pilot Portal Interactive Test Script
 * Opens the pilot portal in a browser for manual testing
 */

async function testPilotPortal() {
  console.log('🚀 Starting Pilot Portal Test...\n')

  let browser

  try {
    // Launch browser in headed mode (visible)
    console.log('📱 Launching browser...')
    browser = await puppeteer.launch({
      headless: false, // Show browser window
      devtools: true, // Open DevTools automatically
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    })

    const page = await browser.newPage()

    // Set up console logging
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()
      if (type === 'error') {
        console.log('❌ Browser Error:', text)
      } else if (type === 'warning') {
        console.log('⚠️  Browser Warning:', text)
      }
    })

    // Navigate to pilot portal (try port 3001 first, fallback to 3000)
    const ports = [3001, 3000]
    let portalUrl = null

    for (const port of ports) {
      try {
        const testUrl = `http://localhost:${port}`
        const response = await fetch(testUrl).catch(() => null)
        if (response) {
          portalUrl = `${testUrl}/portal/login`
          break
        }
      } catch (e) {
        // Try next port
      }
    }

    if (!portalUrl) {
      portalUrl = 'http://localhost:3000/portal/login'
    }

    console.log(`🌐 Navigating to: ${portalUrl}\n`)

    await page.goto(portalUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('✅ Portal loaded successfully!\n')
    console.log('📋 Test Instructions:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. The browser window is now open')
    console.log('2. DevTools is open for debugging')
    console.log('3. You can manually test the pilot portal')
    console.log('4. Test login, navigation, and features')
    console.log('5. Close the browser window when done')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('💡 Test Credentials (if needed):')
    console.log('   Email: pilot@example.com')
    console.log('   Password: (check your database)\n')

    console.log('🔍 Available Pages to Test:')
    console.log('   • /portal/login - Login page')
    console.log('   • /portal/register - Registration page')
    console.log('   • /portal/dashboard - Pilot dashboard (after login)')
    console.log('   • /portal/profile - Pilot profile (after login)')
    console.log('   • /portal/leave-requests - Leave requests (after login)')
    console.log('   • /portal/flight-requests - Flight requests (after login)')
    console.log('   • /portal/notifications - Notifications (after login)')
    console.log('   • /portal/feedback - Feedback (after login)\n')

    console.log('⏳ Browser will remain open until you close it...\n')
    console.log('Press Ctrl+C in this terminal to force close if needed.\n')

    // Keep the script running until the browser is closed
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 }).catch(() => {
      // Ignore navigation timeout - we want to keep browser open
    })

    // Wait for browser to be closed manually
    await new Promise((resolve) => {
      browser.on('disconnected', resolve)
    })
  } catch (error) {
    console.error('\n❌ Error occurred:')
    console.error(error.message)

    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.error('\n⚠️  Development server is not running!')
      console.error('   Please start the dev server first:')
      console.error('   npm run dev\n')
    }
  } finally {
    if (browser) {
      console.log('\n👋 Closing browser...')
      await browser.close()
    }
    console.log('✅ Test session ended.\n')
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Test interrupted by user')
  process.exit(0)
})

// Run the test
testPilotPortal()
