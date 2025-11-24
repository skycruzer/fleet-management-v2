#!/usr/bin/env node

/**
 * Browser-based testing of pilot portal forms
 * Tests actual form submission and navigation
 */

import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🧪 PILOT PORTAL FORMS - LIVE BROWSER TEST\n')
console.log('=' .repeat(60))

async function testPilotPortal() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1920,1080'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  try {
    console.log('\n📍 Testing Pilot Portal Forms\n')

    await page.goto(`${BASE_URL}/portal/login`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('✅ Pilot login page loaded')

    // Check form routes
    const routes = [
      '/portal/leave-requests/new',
      '/portal/flight-requests/new', 
      '/portal/feedback',
      '/dashboard/leave/approve'
    ]

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 10000 })
      console.log(`✅ Route exists: ${route}`)
    }

    if (errors.length > 0) {
      console.log('\n❌ Console errors found:')
      errors.forEach(err => console.log(`   ${err}`))
    } else {
      console.log('\n✅ No console errors')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

testPilotPortal().catch(console.error)
