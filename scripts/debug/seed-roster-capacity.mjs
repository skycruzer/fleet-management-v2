/**
 * Seed Roster Period Capacity for Renewal Planning
 *
 * Creates roster period capacity records for 2025-2026 based on
 * the 28-day roster period system (RP1-RP13)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envContent = readFileSync('.env.local', 'utf-8')
const envLines = envContent.split('\n')
const env = {}
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Known anchor: RP12/2025 starts 2025-10-11
const RP12_2025_START = new Date('2025-10-11')

function calculateRosterPeriod(periodNumber, year) {
  // Calculate days from RP12/2025
  const daysSinceAnchor = ((year - 2025) * 13 + (periodNumber - 12)) * 28

  const startDate = new Date(RP12_2025_START)
  startDate.setDate(startDate.getDate() + daysSinceAnchor)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 27) // 28-day period (0-27)

  return {
    roster_period: `RP${periodNumber}/${year}`, // No zero-padding - must be RP1-RP13
    period_start_date: startDate.toISOString().split('T')[0],
    period_end_date: endDate.toISOString().split('T')[0]
  }
}

async function seedRosterCapacity() {
  console.log('\n🌱 SEEDING ROSTER PERIOD CAPACITY\n')
  console.log('='.repeat(60))

  const periods = []

  // Generate for 2025 (RP1-RP13)
  for (let rp = 1; rp <= 13; rp++) {
    const period = calculateRosterPeriod(rp, 2025)
    periods.push({
      ...period,
      max_pilots_per_category: {
        'Flight Checks': 4,
        'Simulator Checks': 6,
        'Ground Courses Refresher': 8
      },
      current_allocations: {
        'Flight Checks': 0,
        'Simulator Checks': 0,
        'Ground Courses Refresher': 0
      }
    })
  }

  // Generate for 2026 (RP1-RP13)
  for (let rp = 1; rp <= 13; rp++) {
    const period = calculateRosterPeriod(rp, 2026)
    periods.push({
      ...period,
      max_pilots_per_category: {
        'Flight Checks': 4,
        'Simulator Checks': 6,
        'Ground Courses Refresher': 8
      },
      current_allocations: {
        'Flight Checks': 0,
        'Simulator Checks': 0,
        'Ground Courses Refresher': 0
      }
    })
  }

  console.log(`\n📅 Generated ${periods.length} roster periods`)
  console.log(`   - 2025: RP01-RP13 (${periods.filter(p => p.roster_period.includes('2025')).length} periods)`)
  console.log(`   - 2026: RP01-RP13 (${periods.filter(p => p.roster_period.includes('2026')).length} periods)`)

  // Check if data already exists
  const { data: existing, error: checkError } = await supabase
    .from('roster_period_capacity')
    .select('id')
    .limit(1)

  if (checkError) {
    console.error('\n❌ Error checking existing data:', checkError)
    process.exit(1)
  }

  if (existing && existing.length > 0) {
    console.log('\n⚠️  Roster period capacity data already exists')
    console.log('   Run this to clear existing data first:')
    console.log('   DELETE FROM roster_period_capacity;')

    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise(resolve => {
      rl.question('\n❓ Clear existing data and re-seed? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Seeding cancelled')
      process.exit(0)
    }

    // Delete existing data
    const { error: deleteError } = await supabase
      .from('roster_period_capacity')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('\n❌ Error deleting existing data:', deleteError)
      process.exit(1)
    }

    console.log('\n✅ Existing data cleared')
  }

  // Insert new data
  console.log('\n📝 Inserting roster period capacity records...')

  const { data, error } = await supabase
    .from('roster_period_capacity')
    .insert(periods)
    .select()

  if (error) {
    console.error('\n❌ Error inserting data:', error)
    process.exit(1)
  }

  console.log(`\n✅ Successfully seeded ${data.length} roster periods`)

  // Show sample
  console.log('\n📋 Sample records:')
  data.slice(0, 5).forEach(p => {
    console.log(`   - ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('✅ SEEDING COMPLETE')
  console.log('\nRenewal planning should now work!')
  console.log('Try generating a renewal plan at: /dashboard/renewal-planning/generate')
  console.log('\n')
}

seedRosterCapacity().catch(console.error)
