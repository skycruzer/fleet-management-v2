import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== Checking Report Data ===\n')

// Check all pilot_requests with roster periods RP01/2026 or RP02/2026
console.log('1. Checking LEAVE requests for RP01/2026 and RP02/2026:')
const { data: leaveData, error: leaveError } = await supabase
  .from('pilot_requests')
  .select(
    `
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `
  )
  .eq('request_category', 'LEAVE')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])

if (leaveError) {
  console.log('❌ Error:', leaveError.message)
} else {
  console.log(`   Found ${leaveData?.length || 0} leave requests`)
  if (leaveData && leaveData.length > 0) {
    leaveData.forEach((req) => {
      console.log(
        `   - ${req.roster_period}: ${req.pilots?.first_name} ${req.pilots?.last_name} (${req.pilots?.role}) - ${req.request_type} - ${req.start_date} to ${req.end_date}`
      )
    })
  }
}

console.log('\n2. Checking FLIGHT requests for RP01/2026 and RP02/2026:')
const { data: flightData, error: flightError } = await supabase
  .from('pilot_requests')
  .select(
    `
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `
  )
  .eq('request_category', 'FLIGHT')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])

if (flightError) {
  console.log('❌ Error:', flightError.message)
} else {
  console.log(`   Found ${flightData?.length || 0} flight requests`)
  if (flightData && flightData.length > 0) {
    flightData.forEach((req) => {
      console.log(
        `   - ${req.roster_period}: ${req.pilots?.first_name} ${req.pilots?.last_name} (${req.pilots?.role}) - ${req.request_type} - ${req.flight_date}`
      )
    })
  }
}

// Check all data in pilot_requests regardless of filter
console.log('\n3. Checking ALL pilot_requests (no filter):')
const { data: allData, error: allError } = await supabase
  .from('pilot_requests')
  .select(
    `
    id,
    request_category,
    request_type,
    roster_period,
    start_date,
    end_date,
    flight_date,
    pilot_id,
    employee_number
  `
  )
  .order('created_at', { ascending: false })
  .limit(20)

if (allError) {
  console.log('❌ Error:', allError.message)
} else {
  console.log(`   Total records: ${allData?.length || 0}`)
  if (allData && allData.length > 0) {
    console.log('\n   Recent records:')
    allData.forEach((req) => {
      console.log(
        `   - ${req.request_category} | ${req.request_type} | ${req.roster_period} | pilot_id: ${req.pilot_id} | employee_number: ${req.employee_number}`
      )
    })
  }
}

console.log('\n4. Checking if pilots table has data:')
const { count: pilotCount } = await supabase
  .from('pilots')
  .select('*', { count: 'exact', head: true })
console.log(`   Pilots table has ${pilotCount} records`)
