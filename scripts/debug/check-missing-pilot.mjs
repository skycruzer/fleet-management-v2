import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const pilotId = '1a1aa6bc-bf1e-4fd3-b710-efa490754a26'

console.log('\n=== CHECKING MISSING PILOT ===\n')
console.log(`Pilot ID: ${pilotId}\n`)

// Check if pilot exists
const { data: pilot, error: pilotError } = await supabase
  .from('pilots')
  .select('*')
  .eq('id', pilotId)
  .maybeSingle()

if (pilotError) {
  console.error('❌ Error:', pilotError.message)
} else if (!pilot) {
  console.log('❌ Pilot NOT FOUND in pilots table')
  console.log('   This is an orphaned record (invalid pilot_id)')
  console.log('   Action: Skip migration for this record\n')
} else {
  console.log('✅ Pilot FOUND:')
  console.log(`   Name: ${pilot.first_name} ${pilot.last_name}`)
  console.log(`   Employee ID: ${pilot.employee_id}`)
  console.log(`   Role: ${pilot.role}`)
  console.log('   Action: Safe to migrate this record\n')
}

// Get the flight request details
const { data: flightRequest, error: flightError } = await supabase
  .from('flight_requests')
  .select('*')
  .eq('id', 'aee0c0da-2b73-4233-8b59-daa09788fa1b')
  .single()

if (flightError) {
  console.error('❌ Error fetching flight request:', flightError.message)
} else {
  console.log('📋 Flight Request Details:')
  console.log(`   ID: ${flightRequest.id}`)
  console.log(`   Pilot ID: ${flightRequest.pilot_id}`)
  console.log(`   Flight Date: ${flightRequest.flight_date}`)
  console.log(`   Request Type: ${flightRequest.request_type}`)
  console.log(`   Description: ${flightRequest.description}`)
  console.log(`   Status: ${flightRequest.status}`)
  console.log(`   Created: ${flightRequest.created_at}`)
}
