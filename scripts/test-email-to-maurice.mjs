#!/usr/bin/env node

/**
 * Test Certification Expiry Alerts - Send to Maurice Only
 *
 * This script triggers the TEST version of the certification expiry alerts
 * which only sends emails to mrondeau@airniugini.com.pg
 *
 * Usage:
 *   node scripts/test-email-to-maurice.mjs
 *
 * Prerequisites:
 *   - Development server running (npm run dev)
 *   - CRON_SECRET configured in .env.local
 *   - RESEND_API_KEY configured in .env.local
 *   - Resend domain verified (pxb767office.app)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env.local file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const env = {}

    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '')
        env[key] = value
      }
    })

    return env
  } catch (error) {
    console.error('❌ Error reading .env.local:', error.message)
    process.exit(1)
  }
}

const env = loadEnv()
const CRON_SECRET = env.CRON_SECRET || process.env.CRON_SECRET
const APP_URL = env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = 'mrondeau@airniugini.com.pg'

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET not found in environment variables')
  console.error('   Please add CRON_SECRET to your .env.local file')
  process.exit(1)
}

console.log('🧪 Testing Certification Expiry Alerts (TEST MODE)')
console.log('━'.repeat(60))
console.log(`📧 Test Email: ${TEST_EMAIL}`)
console.log(`📍 Endpoint: ${APP_URL}/api/cron/certification-expiry-alerts-test`)
console.log(`🔐 Using CRON_SECRET from environment`)
console.log('')
console.log('⚠️  This will ONLY send emails to Maurice\'s email address')
console.log('   All other pilots will be skipped')
console.log('')

async function testCronJob() {
  try {
    console.log('⏳ Sending request...')
    const startTime = Date.now()

    const response = await fetch(
      `${APP_URL}/api/cron/certification-expiry-alerts-test`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const duration = Date.now() - startTime
    const data = await response.json()

    console.log('')
    console.log('📊 Response Details')
    console.log('━'.repeat(60))
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Duration: ${duration}ms`)
    console.log('')

    if (!response.ok) {
      console.error('❌ Request Failed')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ Request Successful')
    console.log('')
    console.log('📧 Email Summary (TEST MODE)')
    console.log('━'.repeat(60))
    console.log(`Test Email: ${data.testEmail}`)
    console.log(`Total Pilots with Expiring Certs: ${data.summary?.totalPilotsInDatabase || 0}`)
    console.log(`Skipped (not test email): ${data.summary?.skippedNotTestEmail || 0}`)
    console.log(`Emails Sent: ${data.summary?.emailsSent || 0}`)
    console.log(`✅ Successful: ${data.summary?.successful || 0}`)
    console.log(`❌ Failed: ${data.summary?.failed || 0}`)
    console.log('')

    if (data.results && data.results.length > 0) {
      console.log('📋 Detailed Results')
      console.log('━'.repeat(60))
      data.results.forEach((result, index) => {
        const statusIcon = result.success ? '✅' : '❌'
        const urgencyIcon =
          result.urgencyLevel === 'critical' ? '🔴' :
          result.urgencyLevel === 'warning' ? '🟡' : '🔵'

        console.log(`${statusIcon} ${urgencyIcon} ${result.pilotName}`)
        console.log(`   Email: ${result.email}`)
        console.log(`   Certifications: ${result.certificationsCount}`)
        console.log(`   Urgency: ${result.urgencyLevel.toUpperCase()}`)

        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`)
        }
        console.log('')
      })

      console.log('━'.repeat(60))
      console.log('🎉 Test email sent successfully!')
      console.log('')
      console.log('Next Steps:')
      console.log(`1. Check ${TEST_EMAIL} inbox`)
      console.log('2. Verify email formatting and content')
      console.log('3. Confirm urgency level color-coding')
      console.log('4. Test the "View My Certifications" link')
      console.log('5. Once verified, use the production endpoint for all pilots')
    } else {
      console.log('ℹ️  Maurice has no expiring certifications within 90 days')
      console.log('')
      console.log('To test with sample data:')
      console.log('1. Temporarily modify a certification expiry date in the database')
      console.log('2. Set it to expire within 90 days')
      console.log('3. Run this script again')
      console.log('4. Restore the original expiry date after testing')
    }
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ Test Failed')
    console.error('━'.repeat(60))
    console.error('Error:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.error('')
      console.error('Connection refused. Is the development server running?')
      console.error('Run: npm run dev')
    }

    console.error('')
    process.exit(1)
  }
}

// Run the test
testCronJob()
