import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== TESTING LEAVE REQUESTS QUERY ===\n')

// Exact query from reports-service.ts (lines 93-128)
let query = supabase
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
  .order('start_date', { ascending: false })

// Apply roster period filter
const filters = { rosterPeriods: ['RP01/2026', 'RP02/2026'] }
if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
  query = query.in('roster_period', filters.rosterPeriods)
}

const { data, error } = await query

if (error) {
  console.error('❌ Error:', error.message)
} else {
  const count = data?.length || 0
  console.log(`✅ Found ${count} leave requests\n`)

  if (data) {
    data.forEach((req, idx) => {
      console.log(`${idx + 1}. ${req.roster_period}`)
      console.log(`   Pilot object:`, req.pilots)
      console.log(`   Pilot name: ${req.pilots?.first_name} ${req.pilots?.last_name}`)
      console.log(`   Rank: ${req.pilots?.role}`)
      console.log(`   Status: ${req.workflow_status}`)
      console.log(`   Dates: ${req.start_date} to ${req.end_date}\n`)
    })
  }
}

console.log('\n=== TESTING FLIGHT REQUESTS QUERY ===\n')

let flightQuery = supabase
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
  .order('flight_date', { ascending: false, nullsFirst: false })

if (filters.rosterPeriods && filters.rosterPeriods.length > 0) {
  flightQuery = flightQuery.in('roster_period', filters.rosterPeriods)
}

const { data: flightData, error: flightError } = await flightQuery

if (flightError) {
  console.error('❌ Error:', flightError.message)
} else {
  const flightCount = flightData?.length || 0
  console.log(`✅ Found ${flightCount} flight requests\n`)

  if (flightData) {
    flightData.forEach((req, idx) => {
      console.log(`${idx + 1}. ${req.roster_period}`)
      console.log(`   Pilot: ${req.pilots?.first_name} ${req.pilots?.last_name}`)
      console.log(`   Rank: ${req.pilots?.role}`)
      console.log(`   Type: ${req.request_type}`)
      console.log(`   Date: ${req.flight_date || req.start_date}\n`)
    })
  }
}
