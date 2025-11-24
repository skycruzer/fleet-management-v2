/**
 * Clean bad data and reseed properly
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('🧹 Cleaning bad flight request data...\n')

// Delete flight requests with wrong data (RDO type or null flight_date)
const { data: deletedFlight, error: deleteError } = await supabase
  .from('pilot_requests')
  .delete()
  .eq('request_category', 'FLIGHT')
  .or('request_type.eq.RDO,request_type.eq.SDO,flight_date.is.null')

if (deleteError) {
  console.error('❌ Error deleting bad flight requests:', deleteError)
} else {
  console.log(`✅ Deleted bad flight request records\n`)
}

console.log('🌱 Seeding proper flight request data...\n')

// Get existing pilots
const { data: pilots, error: pilotsError } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, role, employee_id')
  .order('seniority_number', { ascending: true })
  .limit(15)

if (pilotsError) {
  console.error('❌ Error fetching pilots:', pilotsError)
  process.exit(1)
}

console.log(`✅ Found ${pilots.length} pilots\n`)

// Create proper flight requests
const flightRequests = [
  {
    pilot_id: pilots[8]?.id || pilots[0].id,
    employee_number: pilots[8]?.employee_id || pilots[0].employee_id,
    rank: pilots[8]?.role || pilots[0].role,
    name: `${pilots[8]?.first_name || pilots[0].first_name} ${pilots[8]?.last_name || pilots[0].last_name}`,
    request_category: 'FLIGHT',
    request_type: 'FLIGHT_REQUEST',
    flight_date: '2025-12-15',
    start_date: '2025-12-15',
    notes: 'Requesting flight assignment from LAX to SYD for positioning',
    reason: 'Positioning for roster start',
    workflow_status: 'SUBMITTED',
    submission_channel: 'PILOT_PORTAL',
    roster_period: 'RP13/2025',
    roster_period_start_date: '2025-12-13',
    roster_publish_date: '2025-11-15',
    roster_deadline_date: '2025-11-21',
  },
  {
    pilot_id: pilots[9]?.id || pilots[1].id,
    employee_number: pilots[9]?.employee_id || pilots[1].employee_id,
    rank: pilots[9]?.role || pilots[1].role,
    name: `${pilots[9]?.first_name || pilots[1].first_name} ${pilots[9]?.last_name || pilots[1].last_name}`,
    request_category: 'FLIGHT',
    request_type: 'STANDBY',
    flight_date: '2026-01-10',
    start_date: '2026-01-10',
    notes: 'Standby flight duty assignment',
    reason: 'Operational coverage',
    workflow_status: 'APPROVED',
    submission_channel: 'ADMIN_PORTAL',
    roster_period: 'RP01/2026',
    roster_period_start_date: '2026-01-10',
    roster_publish_date: '2025-12-13',
    roster_deadline_date: '2025-12-19',
  },
  {
    pilot_id: pilots[10]?.id || pilots[2].id,
    employee_number: pilots[10]?.employee_id || pilots[2].employee_id,
    rank: pilots[10]?.role || pilots[2].role,
    name: `${pilots[10]?.first_name || pilots[2].first_name} ${pilots[10]?.last_name || pilots[2].last_name}`,
    request_category: 'FLIGHT',
    request_type: 'FLIGHT_REQUEST',
    flight_date: '2026-02-15',
    start_date: '2026-02-15',
    notes: 'Flight duty assignment to Brisbane',
    reason: 'Operational standby coverage',
    workflow_status: 'SUBMITTED',
    submission_channel: 'PILOT_PORTAL',
    roster_period: 'RP02/2026',
    roster_period_start_date: '2026-02-07',
    roster_publish_date: '2026-01-10',
    roster_deadline_date: '2026-01-16',
  },
]

// Insert flight requests
console.log('Inserting flight requests...')
const { data: insertedFlight, error: flightError } = await supabase
  .from('pilot_requests')
  .insert(flightRequests)
  .select()

if (flightError) {
  console.error('❌ Error inserting flight requests:', flightError)
} else {
  console.log(`✅ Inserted ${insertedFlight.length} flight requests\n`)
  insertedFlight.forEach(req => {
    console.log(`   - ${req.name} (${req.rank}) - ${req.request_type} - ${req.flight_date} - ${req.roster_period}`)
  })
}

console.log('\n🎉 Data cleanup and reseed complete!')
