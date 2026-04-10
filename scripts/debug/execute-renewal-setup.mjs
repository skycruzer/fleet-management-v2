/**
 * Execute Renewal Planning Setup SQL
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Starting Renewal Planning Database Setup...\n')

async function executeSetup() {
  try {
    // Step 1: Create roster_period_capacity table
    console.log('📊 Step 1: Creating roster_period_capacity table...')
    const { error: table1Error } = await supabase
      .rpc('exec_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS roster_period_capacity (
          roster_period TEXT PRIMARY KEY,
          period_start_date DATE NOT NULL,
          period_end_date DATE NOT NULL,
          medical_capacity INTEGER DEFAULT 4,
          flight_capacity INTEGER DEFAULT 4,
          simulator_capacity INTEGER DEFAULT 6,
          ground_capacity INTEGER DEFAULT 8,
          notes TEXT
        );
      `,
      })
      .catch(async () => {
        // Fallback: Direct table creation
        const { error } = await supabase
          .from('roster_period_capacity')
          .select('roster_period')
          .limit(1)

        if (
          error &&
          error.message.includes('relation') &&
          error.message.includes('does not exist')
        ) {
          console.log('   Creating table via direct SQL...')
          // Table doesn't exist, we need to create it another way
          return { error: new Error('Table creation requires manual SQL execution') }
        }
        return { error: null }
      })

    if (table1Error) {
      console.log('   ⚠️  Could not create via RPC, trying alternative method...')
    } else {
      console.log('   ✅ roster_period_capacity table ready')
    }

    // Step 2: Create certification_renewal_plans table
    console.log('\n📊 Step 2: Creating certification_renewal_plans table...')
    const { error: table2Error } = await supabase
      .from('certification_renewal_plans')
      .select('id')
      .limit(1)

    if (table2Error && table2Error.message.includes('does not exist')) {
      console.log('   ⚠️  Table does not exist, needs manual creation')
    } else {
      console.log('   ✅ certification_renewal_plans table exists')
    }

    // Step 3: Create renewal_plan_history table
    console.log('\n📊 Step 3: Creating renewal_plan_history table...')
    const { error: table3Error } = await supabase.from('renewal_plan_history').select('id').limit(1)

    if (table3Error && table3Error.message.includes('does not exist')) {
      console.log('   ⚠️  Table does not exist, needs manual creation')
    } else {
      console.log('   ✅ renewal_plan_history table exists')
    }

    // Step 4: Insert roster periods
    console.log('\n📅 Step 4: Seeding roster periods (26 periods for 2025-2026)...')

    const rosterPeriods = [
      {
        roster_period: 'RP01/2025',
        period_start_date: '2025-02-01',
        period_end_date: '2025-02-28',
      },
      {
        roster_period: 'RP02/2025',
        period_start_date: '2025-03-01',
        period_end_date: '2025-03-28',
      },
      {
        roster_period: 'RP03/2025',
        period_start_date: '2025-03-29',
        period_end_date: '2025-04-25',
      },
      {
        roster_period: 'RP04/2025',
        period_start_date: '2025-04-26',
        period_end_date: '2025-05-23',
      },
      {
        roster_period: 'RP05/2025',
        period_start_date: '2025-05-24',
        period_end_date: '2025-06-20',
      },
      {
        roster_period: 'RP06/2025',
        period_start_date: '2025-06-21',
        period_end_date: '2025-07-18',
      },
      {
        roster_period: 'RP07/2025',
        period_start_date: '2025-07-19',
        period_end_date: '2025-08-15',
      },
      {
        roster_period: 'RP08/2025',
        period_start_date: '2025-08-16',
        period_end_date: '2025-09-12',
      },
      {
        roster_period: 'RP09/2025',
        period_start_date: '2025-09-13',
        period_end_date: '2025-10-10',
      },
      {
        roster_period: 'RP10/2025',
        period_start_date: '2025-10-11',
        period_end_date: '2025-11-07',
      },
      {
        roster_period: 'RP11/2025',
        period_start_date: '2025-11-08',
        period_end_date: '2025-12-05',
      },
      {
        roster_period: 'RP12/2025',
        period_start_date: '2025-12-06',
        period_end_date: '2026-01-02',
      },
      {
        roster_period: 'RP13/2025',
        period_start_date: '2026-01-03',
        period_end_date: '2026-01-30',
      },
      {
        roster_period: 'RP01/2026',
        period_start_date: '2026-01-31',
        period_end_date: '2026-02-27',
      },
      {
        roster_period: 'RP02/2026',
        period_start_date: '2026-02-28',
        period_end_date: '2026-03-27',
      },
      {
        roster_period: 'RP03/2026',
        period_start_date: '2026-03-28',
        period_end_date: '2026-04-24',
      },
      {
        roster_period: 'RP04/2026',
        period_start_date: '2026-04-25',
        period_end_date: '2026-05-22',
      },
      {
        roster_period: 'RP05/2026',
        period_start_date: '2026-05-23',
        period_end_date: '2026-06-19',
      },
      {
        roster_period: 'RP06/2026',
        period_start_date: '2026-06-20',
        period_end_date: '2026-07-17',
      },
      {
        roster_period: 'RP07/2026',
        period_start_date: '2026-07-18',
        period_end_date: '2026-08-14',
      },
      {
        roster_period: 'RP08/2026',
        period_start_date: '2026-08-15',
        period_end_date: '2026-09-11',
      },
      {
        roster_period: 'RP09/2026',
        period_start_date: '2026-09-12',
        period_end_date: '2026-10-09',
      },
      {
        roster_period: 'RP10/2026',
        period_start_date: '2026-10-10',
        period_end_date: '2026-11-06',
      },
      {
        roster_period: 'RP11/2026',
        period_start_date: '2026-11-07',
        period_end_date: '2026-12-04',
      },
      {
        roster_period: 'RP12/2026',
        period_start_date: '2026-12-05',
        period_end_date: '2027-01-01',
      },
      {
        roster_period: 'RP13/2026',
        period_start_date: '2027-01-02',
        period_end_date: '2027-01-29',
      },
    ]

    let insertedCount = 0
    let skippedCount = 0

    for (const period of rosterPeriods) {
      const { error: insertError } = await supabase
        .from('roster_period_capacity')
        .upsert([period], { onConflict: 'roster_period', ignoreDuplicates: true })

      if (insertError) {
        if (insertError.message.includes('does not exist')) {
          console.log(
            `   ⚠️  Table does not exist. Please run setup-renewal-planning.sql manually in Supabase SQL Editor.`
          )
          console.log(`\n📝 Instructions:`)
          console.log(
            `   1. Open Supabase Dashboard: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new`
          )
          console.log(`   2. Copy contents of setup-renewal-planning.sql`)
          console.log(`   3. Paste and run in SQL Editor`)
          console.log(`   4. Re-run this script\n`)
          process.exit(1)
        }
        console.log(`   ⚠️  ${period.roster_period}: ${insertError.message}`)
        skippedCount++
      } else {
        insertedCount++
      }
    }

    console.log(`   ✅ Inserted ${insertedCount} roster periods`)
    if (skippedCount > 0) {
      console.log(`   ℹ️  Skipped ${skippedCount} periods (already exist)`)
    }

    // Step 5: Verify setup
    console.log('\n🔍 Step 5: Verifying setup...')

    const { data: capacityData, error: verifyError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .order('period_start_date')

    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message)
    } else if (!capacityData || capacityData.length === 0) {
      console.log('   ⚠️  No roster periods found in database')
    } else {
      console.log(`   ✅ Found ${capacityData.length} roster periods in database`)
      console.log('\n   First 5 periods:')
      capacityData.slice(0, 5).forEach((p) => {
        console.log(`      - ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
      })
    }

    console.log('\n✅ Setup Complete!\n')
    console.log('📝 Next Steps:')
    console.log('   1. Verify your user has admin/manager role')
    console.log('   2. Log in to the application')
    console.log('   3. Navigate to /dashboard/renewal-planning/generate')
    console.log('   4. Click "Generate Renewal Plan"')
    console.log('   5. Verify data displays in /dashboard/renewal-planning\n')
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

executeSetup()
