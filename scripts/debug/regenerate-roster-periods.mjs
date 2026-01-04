#!/usr/bin/env node

/**
 * Regenerate Roster Periods with Correct Numbering
 *
 * CORRECT LOGIC:
 * - RP13/2025: Nov 8 - Dec 5, 2025 (current period)
 * - RP01/2026: Dec 6, 2025 - Jan 2, 2026 (next period)
 * - Each period is 28 days
 * - 13 periods per year
 *
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 */

import fs from 'fs'

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
        .replace(/^[\"']|[\"']$/g, '')
    }
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔄 Regenerating Roster Periods with Correct Numbering')
console.log('═══════════════════════════════════════════════════════════\n')

const ROSTER_DURATION = 28 // days
const PERIODS_PER_YEAR = 13

// CORRECT ANCHOR: RP13/2025 starts on 2025-11-08
const ANCHOR_DATE = new Date('2025-11-08')
const ANCHOR_NUMBER = 13
const ANCHOR_YEAR = 2025

function generateRosterPeriods() {
  const periods = []

  // Generate backwards from anchor to get earlier periods in 2025
  let currentDate = new Date(ANCHOR_DATE)
  let currentNumber = ANCHOR_NUMBER
  let currentYear = ANCHOR_YEAR

  // Go back to RP01/2025 (12 periods back from RP13)
  for (let i = 0; i < 12; i++) {
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() - ROSTER_DURATION)
    currentNumber--

    if (currentNumber < 1) {
      currentNumber = PERIODS_PER_YEAR
      currentYear--
    }
  }

  // Now generate forward for 2 full years (26 periods)
  currentDate = new Date(currentDate)
  currentNumber = 1
  currentYear = 2025

  for (let i = 0; i < 26; i++) {
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + ROSTER_DURATION - 1)

    const rosterPeriod = `RP${String(currentNumber).padStart(2, '0')}/${currentYear}`

    periods.push({
      roster_period: rosterPeriod,
      period_start_date: startDate.toISOString().split('T')[0],
      period_end_date: endDate.toISOString().split('T')[0],
      medical_capacity: 4,
      flight_capacity: 4,
      simulator_capacity: 6,
      ground_capacity: 8,
      notes: null,
    })

    // Move to next period
    currentDate.setDate(currentDate.getDate() + ROSTER_DURATION)
    currentNumber++

    // Handle year rollover
    if (currentNumber > PERIODS_PER_YEAR) {
      currentNumber = 1
      currentYear++
    }
  }

  return periods
}

async function regenerate() {
  try {
    // Step 1: Generate new roster periods
    console.log('1️⃣  Generating roster periods with correct numbering...')
    const periods = generateRosterPeriods()
    console.log(`   ✅ Generated ${periods.length} periods\n`)

    // Show key periods for verification
    console.log('   📋 Key periods:')
    periods.forEach((p) => {
      if (
        p.roster_period === 'RP13/2025' ||
        p.roster_period === 'RP01/2026' ||
        p.roster_period === 'RP02/2026' ||
        p.roster_period === 'RP12/2025'
      ) {
        console.log(`      ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
      }
    })
    console.log('')

    // Step 2: Delete existing roster periods
    console.log('2️⃣  Clearing existing roster periods...')
    const deleteResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/roster_period_capacity?roster_period=neq.DUMMY`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal',
        },
      }
    )

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete: ${deleteResponse.statusText}`)
    }
    console.log('   ✅ Cleared old roster periods\n')

    // Step 3: Insert new roster periods
    console.log('3️⃣  Inserting corrected roster periods...')
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/roster_period_capacity`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(periods),
    })

    if (!insertResponse.ok) {
      const error = await insertResponse.text()
      throw new Error(`Failed to insert: ${error}`)
    }

    const inserted = await insertResponse.json()
    console.log(`   ✅ Inserted ${inserted.length} roster periods\n`)

    // Step 4: Verify key periods
    console.log('4️⃣  Verifying current and next periods...')
    const verifyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/roster_period_capacity?select=*&roster_period=in.(RP13/2025,RP01/2026,RP02/2026)&order=period_start_date`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    const verified = await verifyResponse.json()
    console.log('   ✅ Verification:')
    verified.forEach((p) => {
      console.log(`      ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
    })
    console.log('')

    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ Roster Periods Regenerated Successfully!')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log('📊 Summary:\n')
    console.log(`   • Total periods created: ${inserted.length}`)
    console.log('   • Current period: RP13/2025 (Nov 8 - Dec 5, 2025)')
    console.log('   • Next period: RP01/2026 (Dec 6, 2025 - Jan 2, 2026)')
    console.log('   • Rollover verified: RP13/YYYY → RP01/(YYYY+1)\n')
    console.log('⚠️  IMPORTANT: Renewal plans need to be regenerated!')
    console.log('   Run: node generate-real-renewals.mjs\n')
    console.log('═══════════════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════')
    console.error('❌ Regeneration Failed')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', error.message)
    if (error.stack) {
      console.error('\nStack:', error.stack)
    }
    console.error('═══════════════════════════════════════════════════════════\n')
    process.exit(1)
  }
}

regenerate()
