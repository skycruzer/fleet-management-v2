import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestRequests() {
  console.log('Creating test requests for reports...\n')

  // Get active pilots with all needed fields
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, employee_id')
    .eq('is_active', true)
    .limit(10)

  if (pilotsError) {
    console.error('Error fetching pilots:', pilotsError.message)
    return
  }

  if (!pilots || pilots.length === 0) {
    console.error('No active pilots found in database')
    return
  }

  console.log(`Found ${pilots.length} active pilots\n`)

  // Get current roster period
  const { data: currentPeriod } = await supabase
    .from('roster_periods')
    .select('code, start_date, deadline_date, publish_date')
    .gte('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  const rosterPeriod = currentPeriod?.code || 'RP12/2025'
  const rosterPeriodStartDate = currentPeriod?.start_date || '2025-10-11'
  const rosterDeadlineDate = currentPeriod?.deadline_date
  const rosterPublishDate = currentPeriod?.publish_date

  console.log(`Using roster period: ${rosterPeriod}\n`)

  // Create leave requests
  const leaveRequests = []
  for (let i = 0; i < 8; i++) {
    const pilot = pilots[i % pilots.length]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + i * 7)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 3)

    leaveRequests.push({
      pilot_id: pilot.id,
      employee_number: pilot.employee_id,
      rank: pilot.role,
      name: `${pilot.first_name} ${pilot.last_name}`.toUpperCase(),
      request_category: 'LEAVE',
      request_type: ['ANNUAL', 'RDO', 'SDO'][i % 3],
      submission_channel: 'PORTAL',
      submission_date: new Date().toISOString(),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days_count: 4,
      roster_period: rosterPeriod,
      roster_period_start_date: rosterPeriodStartDate,
      roster_deadline_date: rosterDeadlineDate,
      roster_publish_date: rosterPublishDate,
      workflow_status: ['PENDING', 'SUBMITTED', 'IN_REVIEW'][i % 3],
      notes: `Test leave request for ${pilot.first_name} ${pilot.last_name}`,
      is_late_request: false,
      is_past_deadline: false,
      priority_score: 50,
    })
  }

  const { data: insertedLeave, error: leaveError } = await supabase
    .from('pilot_requests')
    .insert(leaveRequests)
    .select()

  if (leaveError) {
    console.error('Error creating leave requests:', leaveError.message)
  } else {
    console.log(`✓ Created ${insertedLeave.length} leave requests`)
  }

  // Create flight requests
  const flightRequests = []
  for (let i = 0; i < 8; i++) {
    const pilot = pilots[(i + 3) % pilots.length]
    const flightDate = new Date()
    flightDate.setDate(flightDate.getDate() + i * 5)

    flightRequests.push({
      pilot_id: pilot.id,
      employee_number: pilot.employee_id,
      rank: pilot.role,
      name: `${pilot.first_name} ${pilot.last_name}`.toUpperCase(),
      request_category: 'FLIGHT',
      request_type: ['TRAINING', 'CHECK', 'LINE'][i % 3],
      submission_channel: 'PORTAL',
      submission_date: new Date().toISOString(),
      start_date: flightDate.toISOString().split('T')[0],
      end_date: flightDate.toISOString().split('T')[0],
      days_count: 1,
      roster_period: rosterPeriod,
      roster_period_start_date: rosterPeriodStartDate,
      roster_deadline_date: rosterDeadlineDate,
      roster_publish_date: rosterPublishDate,
      workflow_status: ['PENDING', 'SUBMITTED'][i % 2],
      notes: `Test flight request - ${['Training flight', 'Check ride', 'Line flight'][i % 3]}`,
      is_late_request: false,
      is_past_deadline: false,
      priority_score: 50,
    })
  }

  const { data: insertedFlight, error: flightError } = await supabase
    .from('pilot_requests')
    .insert(flightRequests)
    .select()

  if (flightError) {
    console.error('Error creating flight requests:', flightError.message)
  } else {
    console.log(`✓ Created ${insertedFlight.length} flight requests`)
  }

  // Verify data
  const { data: verifyLeave } = await supabase
    .from('pilot_requests')
    .select('id')
    .eq('request_category', 'LEAVE')

  const { data: verifyFlight } = await supabase
    .from('pilot_requests')
    .select('id')
    .eq('request_category', 'FLIGHT')

  console.log(`\n=== Summary ===`)
  console.log(`Total LEAVE requests in database: ${verifyLeave?.length || 0}`)
  console.log(`Total FLIGHT requests in database: ${verifyFlight?.length || 0}`)
  console.log(`\nTest data created successfully! You can now generate reports.`)
}

createTestRequests()
