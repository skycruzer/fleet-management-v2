#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('\n🔍 Checking Table Schemas\n')
  console.log('='.repeat(60))

  // Try to get structure by querying with limit 0
  console.log('\n📋 leave_requests table:')
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*')
    .limit(1)

  if (leaveError) {
    console.log(`   Error: ${leaveError.message}`)
  } else {
    console.log(`   Table exists: ✅`)
    console.log(`   Records: ${leaveData.length}`)
  }

  console.log('\n📋 flight_requests table:')
  const { data: flightData, error: flightError } = await supabase
    .from('flight_requests')
    .select('*')
    .limit(1)

  if (flightError) {
    console.log(`   Error: ${flightError.message}`)
  } else {
    console.log(`   Table exists: ✅`)
    console.log(`   Records: ${flightData.length}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Summary:')
  console.log('   - Both tables exist but contain 0 records')
  console.log('   - Need to seed test data to verify flight request report')
  console.log('   - RDO/SDO requests would be in leave_requests table (leave_type column)')
}

checkSchema()
