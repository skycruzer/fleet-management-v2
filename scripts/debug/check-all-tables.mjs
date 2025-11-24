#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllTables() {
  console.log('\n🔍 Checking All Request Tables\n')
  console.log('=' .repeat(60))

  const tables = [
    'leave_requests',
    'flight_requests',
    'leave_bids',
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })

      if (error) {
        console.log(`\n❌ ${table}: Error - ${error.message}`)
      } else {
        console.log(`\n✅ ${table}: ${count} records`)
        if (data && data.length > 0) {
          console.log(`   First record ID: ${data[0].id}`)
        }
      }
    } catch (err) {
      console.log(`\n❌ ${table}: Exception - ${err.message}`)
    }
  }

  // Check if leave_requests table has any data with specific columns
  console.log('\n\n🔍 Detailed leave_requests check:')
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('id, employee_number, leave_type, status, roster_period, start_date, end_date')
    .limit(10)

  if (leaveError) {
    console.log(`   Error: ${leaveError.message}`)
  } else {
    console.log(`   Found ${leaveData.length} records`)
    if (leaveData.length > 0) {
      console.log('   Sample:')
      leaveData.slice(0, 3).forEach(r => {
        console.log(`   - ${r.employee_number}: ${r.leave_type} (${r.status}) ${r.roster_period}`)
      })
    }
  }

  console.log('\n' + '='.repeat(60))
}

checkAllTables()
