import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== CHECKING OLD DEPRECATED TABLES ===\n')

// Check old leave_requests table
console.log('📋 OLD leave_requests table:')
const { data: oldLeave, error: leaveError } = await supabase
  .from('leave_requests')
  .select('*')
  .order('created_at', { ascending: false })

if (leaveError) {
  console.error('❌ Error:', leaveError.message)
} else {
  const count = oldLeave ? oldLeave.length : 0
  console.log(`   Found ${count} records\n`)
  if (oldLeave && oldLeave.length > 0) {
    oldLeave.slice(0, 5).forEach((req, idx) => {
      console.log(`   ${idx + 1}. ID: ${req.id}`)
      console.log(`      Pilot: ${req.pilot_id}`)
      console.log(`      Type: ${req.leave_type}`)
      console.log(`      Status: ${req.status}`)
      console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
      console.log(`      Created: ${req.created_at}\n`)
    })
  }
}

// Check old flight_requests table
console.log('\n📋 OLD flight_requests table:')
const { data: oldFlight, error: flightError } = await supabase
  .from('flight_requests')
  .select('*')
  .order('created_at', { ascending: false })

if (flightError) {
  console.error('❌ Error:', flightError.message)
} else {
  const count = oldFlight ? oldFlight.length : 0
  console.log(`   Found ${count} records\n`)
  if (oldFlight && oldFlight.length > 0) {
    oldFlight.slice(0, 5).forEach((req, idx) => {
      console.log(`   ${idx + 1}. ID: ${req.id}`)
      console.log(`      Pilot: ${req.pilot_id}`)
      console.log(`      Type: ${req.request_type}`)
      console.log(`      Status: ${req.status}`)
      console.log(`      Date: ${req.flight_date}`)
      console.log(`      Created: ${req.created_at}\n`)
    })
  }
}

// Check new pilot_requests table
console.log('\n📋 NEW pilot_requests table:')
const { data: newRequests, error: newError } = await supabase
  .from('pilot_requests')
  .select('*')
  .order('created_at', { ascending: false })

if (newError) {
  console.error('❌ Error:', newError.message)
} else {
  const count = newRequests ? newRequests.length : 0
  console.log(`   Found ${count} records\n`)

  const leaveCount = newRequests
    ? newRequests.filter((r) => r.request_category === 'LEAVE').length
    : 0
  const flightCount = newRequests
    ? newRequests.filter((r) => r.request_category === 'FLIGHT').length
    : 0

  console.log(`   LEAVE requests: ${leaveCount}`)
  console.log(`   FLIGHT requests: ${flightCount}\n`)
}

// Summary comparison
console.log('\n=== MIGRATION STATUS ===\n')
const oldLeaveCount = oldLeave ? oldLeave.length : 0
const oldFlightCount = oldFlight ? oldFlight.length : 0
const newCount = newRequests ? newRequests.length : 0
const newLeaveCount = newRequests
  ? newRequests.filter((r) => r.request_category === 'LEAVE').length
  : 0
const newFlightCount = newRequests
  ? newRequests.filter((r) => r.request_category === 'FLIGHT').length
  : 0

console.log(`Old leave_requests:    ${oldLeaveCount} records`)
console.log(`Old flight_requests:   ${oldFlightCount} records`)
console.log(`New pilot_requests:    ${newCount} records`)
console.log(`  - LEAVE category:    ${newLeaveCount}`)
console.log(`  - FLIGHT category:   ${newFlightCount}`)

const potentialMissing = oldLeaveCount + oldFlightCount - newCount
if (potentialMissing > 0) {
  console.log(`\n⚠️  POTENTIAL MISSING: ${potentialMissing} records may not have been migrated`)
} else {
  console.log('\n✅ All old records appear to be in new table')
}
