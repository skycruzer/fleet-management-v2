#!/usr/bin/env node

import { chromium } from 'playwright'

async function openLogin() {
  console.log('🚀 Opening Fleet Management V2 Login Page...\n')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--start-maximized'],
  })

  const context = await browser.newContext({
    viewport: null,
  })

  const page = await context.newPage()

  try {
    // Navigate to login page
    console.log('📍 Navigating to http://localhost:3000/auth/login')
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    console.log('✅ Login page loaded!')
    console.log('\n📝 Login form is ready for testing')
    console.log('🔑 You can now test the login functionality manually')
    console.log('\n💡 Test credentials (if you have created them in Supabase):')
    console.log('   - Email: your@email.com')
    console.log('   - Password: your_password')
    console.log('\n⏸️  Browser will stay open. Press Ctrl+C to close when done.')

    // Keep the browser open indefinitely
    await page.waitForTimeout(600000) // 10 minutes
  } catch (error) {
    console.error('❌ Error:', error.message)

    // Take screenshot on error
    await page.screenshot({ path: 'login-error.png', fullPage: true })
    console.log('📸 Error screenshot saved: login-error.png')
  }

  console.log('\n🔚 Closing browser...')
  await browser.close()
}

openLogin()
