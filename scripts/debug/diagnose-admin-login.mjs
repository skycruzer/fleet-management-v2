#!/usr/bin/env node
/**
 * Comprehensive diagnosis of admin login issue
 */

import { chromium } from 'playwright'

console.log('🔍 Diagnosing Admin Login Issue\n')

const browser = await chromium.launch({ headless: false, slowMo: 1000 })
const context = await browser.newContext()
const page = await context.newPage()

// Monitor all requests
page.on('request', request => {
  if (request.url().includes('auth') || request.url().includes('dashboard')) {
    console.log(`→ ${request.method()} ${request.url()}`)
  }
})

page.on('response', response => {
  if (response.url().includes('auth') || response.url().includes('dashboard')) {
    console.log(`← ${response.status()} ${response.url()}`)
  }
})

page.on('console', msg => console.log(`[Console] ${msg.text()}`))

try {
  console.log('Step 1: Navigate to login page')
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })

  console.log('\nStep 2: Check cookies BEFORE login')
  const cookiesBefore = await context.cookies()
  console.log('Cookies before login:', cookiesBefore.length)

  console.log('\nStep 3: Fill credentials and login')
  await page.fill('input[type="email"]', 'skycruzer@icloud.com')
  await page.fill('input[type="password"]', 'mron2393')

  console.log('\nStep 4: Submit form')
  await page.click('button[type="submit"]')

  // Wait a bit for authentication
  await page.waitForTimeout(2000)

  console.log('\nStep 5: Check cookies AFTER login')
  const cookiesAfter = await context.cookies()
  console.log('Cookies after login:', cookiesAfter.length)

  // Find Supabase session cookies
  const supabaseCookies = cookiesAfter.filter(c =>
    c.name.includes('supabase') || c.name.includes('sb-')
  )

  console.log('\nSupabase session cookies:')
  supabaseCookies.forEach(cookie => {
    console.log(`  - ${cookie.name}`)
    console.log(`    Domain: ${cookie.domain}`)
    console.log(`    Path: ${cookie.path}`)
    console.log(`    Secure: ${cookie.secure}`)
    console.log(`    HttpOnly: ${cookie.httpOnly}`)
    console.log(`    SameSite: ${cookie.sameSite}`)
    console.log(`    Value length: ${cookie.value.length} chars`)
  })

  console.log('\nStep 6: Try accessing dashboard with these cookies')
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' })

  await page.waitForTimeout(1000)
  const finalUrl = page.url()

  console.log('\nFinal URL:', finalUrl)

  if (finalUrl.includes('/dashboard')) {
    console.log('✅ SUCCESS: Dashboard loaded!')
  } else if (finalUrl.includes('/login')) {
    console.log('❌ FAILED: Redirected back to login')
    console.log('\n🔍 This means server-side cannot see the session')
    console.log('Possible causes:')
    console.log('  1. Cookies not being sent to server')
    console.log('  2. Cookie domain/path mismatch')
    console.log('  3. Server-side Supabase client not reading cookies')
  }

  // Keep browser open
  console.log('\nBrowser staying open for manual inspection...')
  await page.waitForTimeout(10000)

} catch (error) {
  console.error('Error:', error.message)
} finally {
  await browser.close()
}
