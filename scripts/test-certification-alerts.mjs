#!/usr/bin/env node

/**
 * Test Certification Expiry Alerts Cron Job
 *
 * This script manually triggers the certification expiry alerts cron job
 * to test email delivery and functionality before production deployment.
 *
 * Usage:
 *   node scripts/test-certification-alerts.mjs
 *
 * Prerequisites:
 *   - Development server running (npm run dev)
 *   - CRON_SECRET configured in .env.local
 *   - RESEND_API_KEY configured in .env.local
 *   - Resend domain verified (pxb767office.app)
 */

import 'dotenv/config'

const CRON_SECRET = process.env.CRON_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET not found in environment variables')
  console.error('   Please add CRON_SECRET to your .env.local file')
  process.exit(1)
}

console.log('🔔 Testing Certification Expiry Alerts Cron Job')
console.log('━'.repeat(60))
console.log(`📍 Target: ${APP_URL}/api/cron/certification-expiry-alerts`)
console.log(`🔐 Using CRON_SECRET from environment`)
console.log('')

async function testCronJob() {
  try {
    console.log('⏳ Sending request...')
    const startTime = Date.now()

    const response = await fetch(
      `${APP_URL}/api/cron/certification-expiry-alerts`,
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
    console.log('📧 Email Summary')
    console.log('━'.repeat(60))
    console.log(`Total Pilots: ${data.summary?.totalPilots || 0}`)
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

        console.log(`${index + 1}. ${statusIcon} ${urgencyIcon} ${result.pilotName}`)
        console.log(`   Email: ${result.email}`)
        console.log(`   Certifications: ${result.certificationsCount}`)
        console.log(`   Urgency: ${result.urgencyLevel.toUpperCase()}`)

        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`)
        }
        console.log('')
      })
    } else {
      console.log('ℹ️  No pilots with expiring certifications found')
      console.log('')
    }

    console.log('━'.repeat(60))
    console.log('🎉 Test completed successfully!')
    console.log('')
    console.log('Next Steps:')
    console.log('1. Check pilot email inboxes for received alerts')
    console.log('2. Verify email formatting and content')
    console.log('3. Confirm links work correctly')
    console.log('4. Deploy to Vercel for production cron scheduling')
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

    process.exit(1)
  }
}

// Run the test
testCronJob()
