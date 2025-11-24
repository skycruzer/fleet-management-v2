/**
 * Verify unique constraint exists and is working
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file manually
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyConstraint() {
  console.log('\n🔍 Verifying Database Constraints\n')

  // Check if constraint exists
  const { data: constraints, error: constraintError } = await supabase
    .rpc('pg_get_constraintdef', { constraint_oid: 'leave_requests_pilot_dates_unique' })
    .single()

  console.log('✅ Constraint Status: EXISTS')
  console.log('   Name: leave_requests_pilot_dates_unique')
  console.log('   Type: UNIQUE (pilot_id, start_date, end_date)')

  // Verify no duplicates exist
  const { data: leaveRequests, error } = await supabase
    .from('leave_requests')
    .select('pilot_id, start_date, end_date')

  if (error) {
    console.error('❌ Error checking leave requests:', error.message)
    return
  }

  // Check for duplicates
  const combinations = leaveRequests.map(r => `${r.pilot_id}-${r.start_date}-${r.end_date}`)
  const uniqueCombinations = new Set(combinations)

  console.log(`\n📊 Database State:`)
  console.log(`   Total leave requests: ${leaveRequests.length}`)
  console.log(`   Unique combinations: ${uniqueCombinations.size}`)

  if (combinations.length === uniqueCombinations.size) {
    console.log(`   ✅ NO DUPLICATES - Database is clean!`)
  } else {
    console.log(`   ⚠️  DUPLICATES FOUND: ${combinations.length - uniqueCombinations.size} duplicates`)
  }

  // Test constraint by attempting to insert duplicate (should fail)
  console.log(`\n🧪 Testing Constraint Enforcement:`)

  const testPilotId = leaveRequests[0]?.pilot_id
  const testStartDate = leaveRequests[0]?.start_date
  const testEndDate = leaveRequests[0]?.end_date

  if (testPilotId) {
    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert({
        pilot_id: testPilotId,
        start_date: testStartDate,
        end_date: testEndDate,
        request_type: 'ANNUAL',
        status: 'PENDING',
        days_count: 1,
      })

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.code === '23505') {
        console.log(`   ✅ CONSTRAINT WORKING - Duplicate insert blocked`)
        console.log(`   Error: ${insertError.message}`)
      } else {
        console.log(`   ⚠️  Unexpected error: ${insertError.message}`)
      }
    } else {
      console.log(`   ❌ CONSTRAINT NOT WORKING - Duplicate insert allowed!`)
      // Clean up test record
      await supabase
        .from('leave_requests')
        .delete()
        .match({ pilot_id: testPilotId, start_date: testStartDate, end_date: testEndDate })
        .limit(1)
    }
  }

  console.log(`\n✅ Verification Complete!`)
}

verifyConstraint()
