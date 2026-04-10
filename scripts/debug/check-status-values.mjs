import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== CHECKING STATUS VALUES IN OLD TABLES ===\n')

// Check leave_requests status values
const { data: leaveData } = await supabase.from('leave_requests').select('status')

const leaveStatuses = [...new Set(leaveData.map((r) => r.status))].sort()
console.log('Leave requests status values:')
leaveStatuses.forEach((status) => {
  const count = leaveData.filter((r) => r.status === status).length
  console.log(`   ${status}: ${count} records`)
})

// Check flight_requests status values
const { data: flightData } = await supabase.from('flight_requests').select('status')

const flightStatuses = [...new Set(flightData.map((r) => r.status))].sort()
console.log('\nFlight requests status values:')
flightStatuses.forEach((status) => {
  const count = flightData.filter((r) => r.status === status).length
  console.log(`   ${status}: ${count} records`)
})

// Check pilot_requests allowed workflow_status values
console.log('\n=== CHECKING pilot_requests CONSTRAINT ===\n')
const { data: constraintData } = await supabase
  .from('pilot_requests')
  .select('workflow_status')
  .limit(1)

console.log('To check allowed values, we need to query the schema.')
console.log('Allowed values are likely: SUBMITTED, PENDING, APPROVED, REJECTED, CANCELLED')
