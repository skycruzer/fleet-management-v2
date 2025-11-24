/**
 * Execute Renewal Planning Setup SQL (Simple Version)
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 *
 * Run with: node setup-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('   Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Starting Renewal Planning Database Setup...')
console.log(`📍 Connected to: ${supabaseUrl}\n`)

async function setupDatabase() {
  try {
    // Step 1: Check if tables exist and seed roster periods
    console.log('📅 Step 1: Seeding roster periods (26 periods for 2025-2026)...')

    const rosterPeriods = [
      { roster_period: 'RP01/2025', period_start_date: '2025-02-01', period_end_date: '2025-02-28' },
      { roster_period: 'RP02/2025', period_start_date: '2025-03-01', period_end_date: '2025-03-28' },
      { roster_period: 'RP03/2025', period_start_date: '2025-03-29', period_end_date: '2025-04-25' },
      { roster_period: 'RP04/2025', period_start_date: '2025-04-26', period_end_date: '2025-05-23' },
      { roster_period: 'RP05/2025', period_start_date: '2025-05-24', period_end_date: '2025-06-20' },
      { roster_period: 'RP06/2025', period_start_date: '2025-06-21', period_end_date: '2025-07-18' },
      { roster_period: 'RP07/2025', period_start_date: '2025-07-19', period_end_date: '2025-08-15' },
      { roster_period: 'RP08/2025', period_start_date: '2025-08-16', period_end_date: '2025-09-12' },
      { roster_period: 'RP09/2025', period_start_date: '2025-09-13', period_end_date: '2025-10-10' },
      { roster_period: 'RP10/2025', period_start_date: '2025-10-11', period_end_date: '2025-11-07' },
      { roster_period: 'RP11/2025', period_start_date: '2025-11-08', period_end_date: '2025-12-05' },
      { roster_period: 'RP12/2025', period_start_date: '2025-12-06', period_end_date: '2026-01-02' },
      { roster_period: 'RP13/2025', period_start_date: '2026-01-03', period_end_date: '2026-01-30' },
      { roster_period: 'RP01/2026', period_start_date: '2026-01-31', period_end_date: '2026-02-27' },
      { roster_period: 'RP02/2026', period_start_date: '2026-02-28', period_end_date: '2026-03-27' },
      { roster_period: 'RP03/2026', period_start_date: '2026-03-28', period_end_date: '2026-04-24' },
      { roster_period: 'RP04/2026', period_start_date: '2026-04-25', period_end_date: '2026-05-22' },
      { roster_period: 'RP05/2026', period_start_date: '2026-05-23', period_end_date: '2026-06-19' },
      { roster_period: 'RP06/2026', period_start_date: '2026-06-20', period_end_date: '2026-07-17' },
      { roster_period: 'RP07/2026', period_start_date: '2026-07-18', period_end_date: '2026-08-14' },
      { roster_period: 'RP08/2026', period_start_date: '2026-08-15', period_end_date: '2026-09-11' },
      { roster_period: 'RP09/2026', period_start_date: '2026-09-12', period_end_date: '2026-10-09' },
      { roster_period: 'RP10/2026', period_start_date: '2026-10-10', period_end_date: '2026-11-06' },
      { roster_period: 'RP11/2026', period_start_date: '2026-11-07', period_end_date: '2026-12-04' },
      { roster_period: 'RP12/2026', period_start_date: '2026-12-05', period_end_date: '2027-01-01' },
      { roster_period: 'RP13/2026', period_start_date: '2027-01-02', period_end_date: '2027-01-29' },
    ]

    let insertedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const period of rosterPeriods) {
      const { error: insertError } = await supabase
        .from('roster_period_capacity')
        .upsert([period], { onConflict: 'roster_period', ignoreDuplicates: true })

      if (insertError) {
        if (insertError.message.includes('does not exist')) {
          console.log(`\n   ❌ Table 'roster_period_capacity' does not exist!`)
          console.log(`\n📝 MANUAL SETUP REQUIRED:`)
          console.log(`   1. Open Supabase SQL Editor: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new`)
          console.log(`   2. Copy the contents of 'setup-renewal-planning.sql'`)
          console.log(`   3. Paste and execute in SQL Editor`)
          console.log(`   4. Re-run this script\n`)
          process.exit(1)
        }
        console.log(`   ⚠️  ${period.roster_period}: ${insertError.message}`)
        errorCount++
      } else {
        insertedCount++
        process.stdout.write('.')
      }
    }

    console.log(`\n   ✅ Successfully processed ${insertedCount} roster periods`)
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} periods (already exist)`)
    }
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors occurred`)
    }

    // Step 2: Verify setup
    console.log('\n🔍 Step 2: Verifying database setup...')

    const { data: capacityData, error: verifyError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .order('period_start_date')

    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message)
      process.exit(1)
    }

    if (!capacityData || capacityData.length === 0) {
      console.log('   ⚠️  No roster periods found in database')
      process.exit(1)
    }

    console.log(`   ✅ Found ${capacityData.length} roster periods in database`)
    console.log('\n   First 5 periods:')
    capacityData.slice(0, 5).forEach(p => {
      console.log(`      - ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
    })

    console.log(`\n   Last period:`)
    console.log(`      - ${capacityData[capacityData.length - 1].roster_period}: ${capacityData[capacityData.length - 1].period_start_date} to ${capacityData[capacityData.length - 1].period_end_date}`)

    console.log('\n✅ Database Setup Complete!\n')
    console.log('📝 Next Steps:')
    console.log('   1. Verify your user role is admin/manager:')
    console.log('      SELECT id, email, role FROM an_users WHERE email = \'your@email.com\';')
    console.log('   2. Log in to the application')
    console.log('   3. Navigate to /dashboard/renewal-planning/generate')
    console.log('   4. Click "Generate Renewal Plan"')
    console.log('   5. View plans at /dashboard/renewal-planning\n')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

setupDatabase()
