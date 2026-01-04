import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const { count: leaveCount, error: leaveError } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })

const { count: flightCount, error: flightError } = await supabase
  .from('flight_requests')
  .select('*', { count: 'exact', head: true })

console.log('Leave Requests:', leaveCount, leaveError ? `(Error: ${leaveError.message})` : '')
console.log('Flight Requests:', flightCount, flightError ? `(Error: ${flightError.message})` : '')

// Get actual records with pilot info
const { data: leaveData } = await supabase
  .from('leave_requests')
  .select(
    `
    id,
    request_type,
    start_date,
    end_date,
    roster_period,
    pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)
  `
  )
  .limit(3)

console.log('\nSample Leave Requests:')
leaveData?.forEach((req) => {
  console.log(
    `  - ${req.pilot?.first_name} ${req.pilot?.last_name} (${req.pilot?.role}): ${req.request_type} ${req.start_date} to ${req.end_date} [${req.roster_period}]`
  )
})

const { data: flightData } = await supabase
  .from('flight_requests')
  .select(
    `
    id,
    request_type,
    flight_date,
    description,
    pilot:pilots!flight_requests_pilot_id_fkey(first_name, last_name, role)
  `
  )
  .limit(3)

console.log('\nSample Flight Requests:')
flightData?.forEach((req) => {
  console.log(
    `  - ${req.pilot?.first_name} ${req.pilot?.last_name} (${req.pilot?.role}): ${req.request_type} on ${req.flight_date}`
  )
})
