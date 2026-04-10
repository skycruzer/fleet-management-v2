import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS for seeding
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function seedReportsData() {
  console.log('🌱 Seeding reports test data...\n')

  // Get existing pilots
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, employee_id')
    .order('seniority_number', { ascending: true })
    .limit(15)

  if (pilotsError) {
    console.error('❌ Error fetching pilots:', pilotsError)
    return
  }

  console.log(`✅ Found ${pilots.length} pilots\n`)

  // Leave Request seed data - using correct column names from schema
  const leaveRequests = [
    {
      pilot_id: pilots[0].id,
      request_type: 'ANNUAL',
      start_date: '2025-12-29',
      end_date: '2026-01-15',
      days_count: 17,
      status: 'APPROVED',
      roster_period: 'RP01/2026',
      notes: 'Christmas holiday',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[1].id,
      request_type: 'ANNUAL',
      start_date: '2026-01-26',
      end_date: '2026-02-08',
      days_count: 13,
      status: 'APPROVED',
      roster_period: 'RP02/2026',
      notes: 'Family vacation',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[2].id,
      request_type: 'SICK',
      start_date: '2025-11-17',
      end_date: '2025-11-20',
      days_count: 3,
      status: 'APPROVED',
      roster_period: 'RP12/2025',
      notes: 'Medical appointment',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[3].id,
      request_type: 'RDO',
      start_date: '2025-11-24',
      end_date: '2025-11-25',
      days_count: 2,
      status: 'PENDING',
      roster_period: 'RP12/2025',
      notes: 'Rostered days off',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[4].id,
      request_type: 'ANNUAL',
      start_date: '2026-02-23',
      end_date: '2026-03-08',
      days_count: 13,
      status: 'PENDING',
      roster_period: 'RP03/2026',
      notes: 'Annual leave',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[5].id,
      request_type: 'SDO',
      start_date: '2025-12-01',
      end_date: '2025-12-02',
      days_count: 2,
      status: 'REJECTED',
      roster_period: 'RP13/2025',
      notes: 'Special days off - insufficient coverage',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[6].id,
      request_type: 'ANNUAL',
      start_date: '2026-03-22',
      end_date: '2026-04-04',
      days_count: 13,
      status: 'APPROVED',
      roster_period: 'RP04/2026',
      notes: 'Spring break',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[7].id,
      request_type: 'COMPASSIONATE',
      start_date: '2025-11-18',
      end_date: '2025-11-22',
      days_count: 4,
      status: 'APPROVED',
      roster_period: 'RP12/2025',
      notes: 'Family emergency',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[8].id,
      request_type: 'ANNUAL',
      start_date: '2026-04-19',
      end_date: '2026-05-02',
      days_count: 13,
      status: 'PENDING',
      roster_period: 'RP05/2026',
      notes: 'Summer vacation planning',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[9].id,
      request_type: 'ANNUAL',
      start_date: '2026-05-17',
      end_date: '2026-05-30',
      days_count: 13,
      status: 'APPROVED',
      roster_period: 'RP06/2026',
      notes: 'Extended leave',
      created_at: new Date().toISOString(),
    },
  ]

  // Insert leave requests
  const { data: insertedLeave, error: leaveError } = await supabase
    .from('leave_requests')
    .insert(leaveRequests)
    .select()

  if (leaveError) {
    console.error('❌ Error inserting leave requests:', leaveError)
  } else {
    console.log(`✅ Inserted ${insertedLeave.length} leave requests\n`)
  }

  // Flight Request seed data - valid types: FLIGHT_REQUEST, RDO, SDO, OFFICE_DAY
  // Use default status (null or SUBMITTED) to avoid constraint violation
  const flightRequests = [
    {
      pilot_id: pilots[10]?.id || pilots[0].id,
      request_type: 'FLIGHT_REQUEST',
      description: 'Requesting flight assignment from LAX to SYD for positioning',
      flight_date: '2025-12-15',
      route_details: { departure: 'LAX', arrival: 'SYD' },
      reason: 'Positioning for roster start',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[11]?.id || pilots[1].id,
      request_type: 'RDO',
      description: 'Requesting rostered days off for personal reasons',
      flight_date: '2026-01-10',
      route_details: null,
      reason: 'Family commitments',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[12]?.id || pilots[2].id,
      request_type: 'FLIGHT_REQUEST',
      description: 'Standby flight duty assignment to Brisbane',
      flight_date: '2025-11-25',
      route_details: { departure: 'SYD', arrival: 'BNE' },
      reason: 'Operational standby coverage',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[13]?.id || pilots[3].id,
      request_type: 'SDO',
      description: 'Special days off request for medical appointment',
      flight_date: '2026-02-14',
      route_details: null,
      reason: 'Medical appointment scheduled',
      created_at: new Date().toISOString(),
    },
    {
      pilot_id: pilots[14]?.id || pilots[4].id,
      request_type: 'OFFICE_DAY',
      description: 'Request for office administrative duties day',
      flight_date: '2026-03-05',
      route_details: null,
      reason: 'Administrative duties required',
      created_at: new Date().toISOString(),
    },
  ]

  // Insert flight requests
  const { data: insertedFlight, error: flightError } = await supabase
    .from('flight_requests')
    .insert(flightRequests)
    .select()

  if (flightError) {
    console.error('❌ Error inserting flight requests:', flightError)
  } else {
    console.log(`✅ Inserted ${insertedFlight.length} flight requests\n`)
  }

  console.log('🎉 Seed data complete!')
}

seedReportsData()
