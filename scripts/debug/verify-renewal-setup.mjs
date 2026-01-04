#!/usr/bin/env node

/**
 * Verify Renewal Planning Setup
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 */

import fs from 'fs'

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 Verifying Renewal Planning Setup')
console.log('═══════════════════════════════════════════════════════════\n')

async function verifySetup() {
  try {
    // Check roster_period_capacity table
    console.log('1️⃣  Checking roster_period_capacity table...')
    const capacityResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/roster_period_capacity?select=*&order=period_start_date`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    if (!capacityResponse.ok) {
      const error = await capacityResponse.text()
      console.log('   ❌ FAILED:', error)
      throw new Error('roster_period_capacity table not found or inaccessible')
    }

    const capacityData = await capacityResponse.json()
    console.log(`   ✅ Found ${capacityData.length} roster periods`)

    if (capacityData.length > 0) {
      const firstPeriod = capacityData[0]
      const lastPeriod = capacityData[capacityData.length - 1]
      console.log(`   📅 Range: ${firstPeriod.roster_period} to ${lastPeriod.roster_period}`)
      console.log(
        `   📊 Sample capacities: Flight=${firstPeriod.flight_capacity}, Simulator=${firstPeriod.simulator_capacity}, Ground=${firstPeriod.ground_capacity}\n`
      )
    }

    // Check certification_renewal_plans table
    console.log('2️⃣  Checking certification_renewal_plans table...')
    const plansResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    )

    if (!plansResponse.ok) {
      const error = await plansResponse.text()
      console.log('   ❌ FAILED:', error)
      throw new Error('certification_renewal_plans table not found or inaccessible')
    }

    const plansCount = plansResponse.headers.get('content-range')?.split('/')[1] || '0'
    console.log(`   ✅ Table exists (${plansCount} renewal plans currently stored)\n`)

    // Check renewal_plan_history table
    console.log('3️⃣  Checking renewal_plan_history table...')
    const historyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/renewal_plan_history?select=count&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    if (!historyResponse.ok) {
      console.log('   ⚠️  Table may not exist (non-critical)')
    } else {
      console.log('   ✅ Table exists\n')
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ Database Setup Verified!')
    console.log('═══════════════════════════════════════════════════════════\n')

    if (plansCount === '0') {
      console.log('📝 Next Steps:\n')
      console.log('   The tables are created but empty. To generate renewal plans:\n')
      console.log('   1. Start your dev server: npm run dev')
      console.log('   2. Log in to your application')
      console.log('   3. Navigate to: /dashboard/renewal-planning/generate')
      console.log('   4. Click "Generate Renewal Plan" button\n')
      console.log('   This will:')
      console.log('   • Fetch all certifications expiring in next 12 months')
      console.log('   • Calculate optimal renewal windows')
      console.log('   • Distribute renewals evenly across roster periods')
      console.log('   • Save plans to database\n')
    } else {
      console.log('🎉 You already have renewal plans in the database!\n')
      console.log('   View them at: /dashboard/renewal-planning\n')
    }

    console.log('═══════════════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════')
    console.error('❌ Verification Failed')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', error.message)
    console.error('═══════════════════════════════════════════════════════════\n')
    process.exit(1)
  }
}

verifySetup()
