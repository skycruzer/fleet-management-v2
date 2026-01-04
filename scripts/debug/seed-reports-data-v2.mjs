/**
 * Seed Reports Data for pilot_requests table
 * Author: Maurice Rondeau
 * Date: November 17, 2025
 *
 * Seeds the unified pilot_requests table with test data for reports
 */

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
  console.log('🌱 Seeding reports test data into pilot_requests table...\n')

  // Get existing pilots with employee_id
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, employee_id')
    .order('seniority_number', { ascending: true })
    .limit(15)

  if (pilotsError) {
    console.error('❌ Error fetching pilots:', pilotsError)
    return
  }

  if (!pilots || pilots.length === 0) {
    console.error('❌ No pilots found in database')
    return
  }

  console.log(`✅ Found ${pilots.length} pilots\n`)

  // Leave requests - using pilot_requests table with LEAVE category
  const leaveRequests = [
    {
      pilot_id: pilots[0].id,
      employee_number: pilots[0].employee_id,
      rank: pilots[0].role,
      name: `${pilots[0].first_name} ${pilots[0].last_name}`,
      request_category: 'LEAVE',
      request_type: 'ANNUAL',
      start_date: '2025-12-29',
      end_date: '2026-01-15',
      days_count: 17,
      workflow_status: 'APPROVED',
      submission_channel: 'ADMIN_PORTAL',
      roster_period: 'RP13/2025',
      roster_period_start_date: '2025-12-13',
      roster_publish_date: '2025-11-15',
      roster_deadline_date: '2025-11-21',
      notes: 'Christmas holiday - spans RP13/2025 and RP01/2026',
    },
    {
      pilot_id: pilots[1].id,
      employee_number: pilots[1].employee_id,
      rank: pilots[1].role,
      name: `${pilots[1].first_name} ${pilots[1].last_name}`,
      request_category: 'LEAVE',
      request_type: 'ANNUAL',
      start_date: '2026-01-26',
      end_date: '2026-02-08',
      days_count: 13,
      workflow_status: 'APPROVED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP01/2026',
      roster_period_start_date: '2026-01-10',
      roster_publish_date: '2025-12-13',
      roster_deadline_date: '2025-12-19',
      notes: 'Family vacation - spans RP01/2026 and RP02/2026',
    },
    {
      pilot_id: pilots[2].id,
      employee_number: pilots[2].employee_id,
      rank: pilots[2].role,
      name: `${pilots[2].first_name} ${pilots[2].last_name}`,
      request_category: 'LEAVE',
      request_type: 'SICK',
      start_date: '2025-11-17',
      end_date: '2025-11-20',
      days_count: 3,
      workflow_status: 'APPROVED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP12/2025',
      roster_period_start_date: '2025-10-11',
      roster_publish_date: '2025-09-13',
      roster_deadline_date: '2025-09-19',
      notes: 'Medical appointment',
    },
    {
      pilot_id: pilots[3].id,
      employee_number: pilots[3].employee_id,
      rank: pilots[3].role,
      name: `${pilots[3].first_name} ${pilots[3].last_name}`,
      request_category: 'LEAVE',
      request_type: 'RDO',
      start_date: '2025-11-24',
      end_date: '2025-11-25',
      days_count: 2,
      workflow_status: 'SUBMITTED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP12/2025',
      roster_period_start_date: '2025-10-11',
      roster_publish_date: '2025-09-13',
      roster_deadline_date: '2025-09-19',
      notes: 'Rostered days off',
    },
    {
      pilot_id: pilots[4].id,
      employee_number: pilots[4].employee_id,
      rank: pilots[4].role,
      name: `${pilots[4].first_name} ${pilots[4].last_name}`,
      request_category: 'LEAVE',
      request_type: 'ANNUAL',
      start_date: '2026-02-23',
      end_date: '2026-03-08',
      days_count: 13,
      workflow_status: 'SUBMITTED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP02/2026',
      roster_period_start_date: '2026-02-07',
      roster_publish_date: '2026-01-10',
      roster_deadline_date: '2026-01-16',
      notes: 'Annual leave - spans RP02/2026 and RP03/2026',
    },
    {
      pilot_id: pilots[5].id,
      employee_number: pilots[5].employee_id,
      rank: pilots[5].role,
      name: `${pilots[5].first_name} ${pilots[5].last_name}`,
      request_category: 'LEAVE',
      request_type: 'SDO',
      start_date: '2025-12-01',
      end_date: '2025-12-02',
      days_count: 2,
      workflow_status: 'DENIED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP13/2025',
      roster_period_start_date: '2025-12-13',
      roster_publish_date: '2025-11-15',
      roster_deadline_date: '2025-11-21',
      notes: 'Special days off - insufficient coverage',
    },
    {
      pilot_id: pilots[6].id,
      employee_number: pilots[6].employee_id,
      rank: pilots[6].role,
      name: `${pilots[6].first_name} ${pilots[6].last_name}`,
      request_category: 'LEAVE',
      request_type: 'ANNUAL',
      start_date: '2026-03-22',
      end_date: '2026-04-04',
      days_count: 13,
      workflow_status: 'APPROVED',
      submission_channel: 'ADMIN_PORTAL',
      roster_period: 'RP04/2026',
      roster_period_start_date: '2026-03-07',
      roster_publish_date: '2026-02-07',
      roster_deadline_date: '2026-02-13',
      notes: 'Spring break',
    },
    {
      pilot_id: pilots[7].id,
      employee_number: pilots[7].employee_id,
      rank: pilots[7].role,
      name: `${pilots[7].first_name} ${pilots[7].last_name}`,
      request_category: 'LEAVE',
      request_type: 'COMPASSIONATE',
      start_date: '2025-11-18',
      end_date: '2025-11-22',
      days_count: 4,
      workflow_status: 'APPROVED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP12/2025',
      roster_period_start_date: '2025-10-11',
      roster_publish_date: '2025-09-13',
      roster_deadline_date: '2025-09-19',
      notes: 'Family emergency',
    },
  ]

  // Insert leave requests
  console.log('Inserting leave requests...')
  const { data: insertedLeave, error: leaveError } = await supabase
    .from('pilot_requests')
    .insert(leaveRequests)
    .select()

  if (leaveError) {
    console.error('❌ Error inserting leave requests:', leaveError)
  } else {
    console.log(`✅ Inserted ${insertedLeave.length} leave requests\n`)
  }

  // Flight requests - using pilot_requests table with FLIGHT category
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
      description: 'Requesting flight assignment from LAX to SYD for positioning',
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
      description: 'Standby flight duty assignment',
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
      flight_date: '2025-11-25',
      start_date: '2025-11-25',
      description: 'Standby flight duty assignment to Brisbane',
      reason: 'Operational standby coverage',
      workflow_status: 'SUBMITTED',
      submission_channel: 'PILOT_PORTAL',
      roster_period: 'RP12/2025',
      roster_period_start_date: '2025-10-11',
      roster_publish_date: '2025-09-13',
      roster_deadline_date: '2025-09-19',
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
  }

  console.log('🎉 Seed data complete!')
  console.log(`\nTotal records in pilot_requests:`)
  const { count } = await supabase
    .from('pilot_requests')
    .select('*', { count: 'exact', head: true })
  console.log(`  ${count} records`)
}

seedReportsData()
