/**
 * Renewal Planning Diagnostic Script
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 *
 * This script checks all prerequisites for renewal planning to work correctly.
 * Run with: node diagnose-renewal-planning.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Renewal Planning Diagnostic Report')
console.log('=====================================\n')

async function checkDatabase() {
  console.log('📊 Checking Database Tables...\n')

  // Check roster_period_capacity table
  console.log('1. Checking roster_period_capacity table...')
  const { data: capacityData, error: capacityError } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .limit(5)

  if (capacityError) {
    console.error('   ❌ roster_period_capacity table ERROR:', capacityError.message)
    console.log(
      '   💡 Solution: Run SQL from RENEWAL-PLANNING-SETUP-GUIDE.md to create this table\n'
    )
    return false
  }

  if (!capacityData || capacityData.length === 0) {
    console.error('   ❌ roster_period_capacity table is EMPTY')
    console.log('   💡 Solution: Run the seeding SQL from RENEWAL-PLANNING-SETUP-GUIDE.md\n')
    return false
  }

  console.log(
    `   ✅ roster_period_capacity table exists with ${capacityData.length} periods (showing first 5)`
  )
  capacityData.forEach((period) => {
    console.log(
      `      - ${period.roster_period}: ${period.period_start_date} to ${period.period_end_date}`
    )
  })
  console.log('')

  // Check certification_renewal_plans table
  console.log('2. Checking certification_renewal_plans table...')
  const { data: plansData, error: plansError } = await supabase
    .from('certification_renewal_plans')
    .select('id, pilot_id, planned_roster_period, status')
    .limit(5)

  if (plansError) {
    console.error('   ❌ certification_renewal_plans table ERROR:', plansError.message)
    console.log(
      '   💡 Solution: Run SQL from RENEWAL-PLANNING-SETUP-GUIDE.md to create this table\n'
    )
    return false
  }

  console.log(`   ✅ certification_renewal_plans table exists with ${plansData?.length || 0} plans`)
  if (plansData && plansData.length > 0) {
    console.log('      Recent plans:')
    plansData.forEach((plan) => {
      console.log(
        `      - Plan ${plan.id}: Roster Period ${plan.planned_roster_period}, Status: ${plan.status}`
      )
    })
  } else {
    console.log('      ⚠️  No renewal plans generated yet. Run "Generate Plan" in the UI.')
  }
  console.log('')

  return true
}

async function runDiagnostics() {
  try {
    const dbOk = await checkDatabase()

    console.log('\n📝 Summary')
    console.log('==========\n')

    if (!dbOk) {
      console.log('❌ CRITICAL: Database tables are missing or empty')
      console.log('   Action Required: Run SQL scripts from RENEWAL-PLANNING-SETUP-GUIDE.md\n')
    } else {
      console.log('✅ Database tables configured correctly!')
      console.log('   If renewal planning still shows no data:')
      console.log('   1. Verify user has admin/manager role')
      console.log('   2. Click "Generate Plan" button in UI')
      console.log('   3. Check browser console for errors\n')
    }

    console.log('📖 Full documentation: RENEWAL-PLANNING-SETUP-GUIDE.md')
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
    process.exit(1)
  }
}

runDiagnostics()
