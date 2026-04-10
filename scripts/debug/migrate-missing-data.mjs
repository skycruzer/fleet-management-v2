/**
 * Migrate Missing Data from Old Tables to New pilot_requests Table
 *
 * This script migrates all records from the deprecated leave_requests and flight_requests
 * tables into the new unified pilot_requests table.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== MIGRATING MISSING DATA ===\n')

// Roster period constants (from roster-period-service.ts)
const ANCHOR_START_DATE = new Date('2025-10-11')
const ANCHOR_ROSTER_PERIOD = 12
const ANCHOR_YEAR = 2025
const ROSTER_PERIOD_DAYS = 28
const ROSTER_PERIODS_PER_YEAR = 13
const ROSTER_PUBLISH_DAYS_BEFORE = 10
const REQUEST_DEADLINE_DAYS_BEFORE = 31 // 10 + 21

// Helper to calculate roster period dates from a date
function calculateRosterPeriodDates(dateStr) {
  const date = new Date(dateStr)

  // Calculate days from anchor
  const daysDiff = Math.floor(
    (date.getTime() - ANCHOR_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate periods from anchor
  const periodsDiff = Math.floor(daysDiff / ROSTER_PERIOD_DAYS)

  // Calculate total period number
  const totalPeriod = ANCHOR_ROSTER_PERIOD + periodsDiff

  // Calculate year: how many complete cycles have passed
  let year = ANCHOR_YEAR + Math.floor(totalPeriod / ROSTER_PERIODS_PER_YEAR)

  // Calculate period within the year (1-13)
  let periodNumber = totalPeriod % ROSTER_PERIODS_PER_YEAR
  if (periodNumber <= 0) {
    periodNumber += ROSTER_PERIODS_PER_YEAR
    year -= 1
  }

  // Calculate the roster period start date
  const rosterStartDate = new Date(ANCHOR_START_DATE)
  rosterStartDate.setDate(rosterStartDate.getDate() + periodsDiff * ROSTER_PERIOD_DAYS)

  // Calculate publish date (10 days before start)
  const publishDate = new Date(rosterStartDate)
  publishDate.setDate(publishDate.getDate() - ROSTER_PUBLISH_DAYS_BEFORE)

  // Calculate deadline date (31 days before start)
  const deadlineDate = new Date(rosterStartDate)
  deadlineDate.setDate(deadlineDate.getDate() - REQUEST_DEADLINE_DAYS_BEFORE)

  const code = `RP${periodNumber.toString().padStart(2, '0')}/${year}`

  return {
    code,
    periodNumber,
    year,
    startDate: rosterStartDate.toISOString().split('T')[0],
    publishDate: publishDate.toISOString().split('T')[0],
    deadlineDate: deadlineDate.toISOString().split('T')[0],
  }
}

// Helper to get roster period code from date
function getRosterPeriodFromDate(dateStr) {
  const rosterPeriod = calculateRosterPeriodDates(dateStr)
  return rosterPeriod.code
}

// Helper to calculate days count between two dates
function calculateDaysCount(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end day
}

// Helper to map old status values to new workflow_status values
function mapStatusToWorkflowStatus(oldStatus) {
  const statusMap = {
    PENDING: 'SUBMITTED', // Old pending → new submitted
    APPROVED: 'APPROVED', // Same value
    REJECTED: 'DENIED', // Old rejected → new denied
  }

  return statusMap[oldStatus] || 'SUBMITTED' // Default to SUBMITTED if unknown
}

// Get pilot details
async function getPilotDetails(pilotId) {
  const { data, error } = await supabase
    .from('pilots')
    .select('employee_id, role, first_name, last_name')
    .eq('id', pilotId)
    .single()

  if (error || !data) {
    console.error(`Failed to get pilot details for ${pilotId}`)
    return null
  }

  return {
    employee_number: data.employee_id,
    rank: data.role,
    name: `${data.first_name} ${data.last_name}`,
  }
}

// Step 1: Migrate leave requests
console.log('📋 Step 1: Migrating leave requests...\n')

const { data: oldLeaveRequests, error: leaveError } = await supabase
  .from('leave_requests')
  .select('*')
  .order('created_at', { ascending: true })

if (leaveError) {
  console.error('❌ Failed to fetch leave_requests:', leaveError.message)
  process.exit(1)
}

console.log(`   Found ${oldLeaveRequests.length} leave requests in old table`)

let leaveMigrated = 0
let leaveSkipped = 0

for (const oldReq of oldLeaveRequests) {
  // Check if already migrated (by matching pilot_id, start_date, end_date)
  const { data: existing } = await supabase
    .from('pilot_requests')
    .select('id')
    .eq('pilot_id', oldReq.pilot_id)
    .eq('start_date', oldReq.start_date)
    .eq('end_date', oldReq.end_date)
    .eq('request_category', 'LEAVE')
    .maybeSingle()

  if (existing) {
    leaveSkipped++
    continue
  }

  // Get pilot details
  const pilotDetails = await getPilotDetails(oldReq.pilot_id)
  if (!pilotDetails) {
    console.error(`   ⚠️  Skipping - no pilot found for ${oldReq.pilot_id}`)
    leaveSkipped++
    continue
  }

  // Calculate roster period and related dates
  const rosterPeriod = getRosterPeriodFromDate(oldReq.start_date)
  const rosterDates = calculateRosterPeriodDates(oldReq.start_date)

  // Calculate submission date (use created_at)
  const submissionDate = oldReq.created_at
    ? new Date(oldReq.created_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  // Calculate if late request (submitted after deadline)
  const deadlineDate = new Date(rosterDates.deadlineDate)
  const submittedDate = new Date(submissionDate)
  const isLateRequest = submittedDate > deadlineDate
  const isPastDeadline = isLateRequest

  // Calculate days count (for leave requests)
  const daysCount = calculateDaysCount(oldReq.start_date, oldReq.end_date)

  // Map old schema to new schema
  const newRequest = {
    pilot_id: oldReq.pilot_id,
    employee_number: pilotDetails.employee_number,
    rank: pilotDetails.rank,
    name: pilotDetails.name,
    request_category: 'LEAVE',
    request_type: oldReq.leave_type || 'ANNUAL', // Default to ANNUAL if null
    submission_channel: 'ADMIN_PORTAL', // Migrated data
    start_date: oldReq.start_date,
    end_date: oldReq.end_date,
    roster_period: rosterPeriod,
    roster_period_start_date: rosterDates.startDate,
    roster_publish_date: rosterDates.publishDate,
    roster_deadline_date: rosterDates.deadlineDate,
    submission_date: submissionDate,
    is_late_request: isLateRequest,
    is_past_deadline: isPastDeadline,
    days_count: daysCount,
    priority_score: 0, // Default priority score
    conflict_flags: [], // Empty conflict flags initially
    workflow_status: mapStatusToWorkflowStatus(oldReq.status || 'PENDING'), // Map old status to new workflow_status
    reason: oldReq.reason,
    notes: `Migrated from leave_requests table on ${new Date().toISOString()}`,
    created_at: oldReq.created_at,
    updated_at: oldReq.updated_at,
  }

  // Insert into pilot_requests
  const { error: insertError } = await supabase.from('pilot_requests').insert(newRequest)

  if (insertError) {
    console.error(`   ❌ Failed to migrate leave request ${oldReq.id}:`, insertError.message)
    leaveSkipped++
  } else {
    leaveMigrated++
  }
}

console.log(`   ✅ Migrated: ${leaveMigrated}`)
console.log(`   ⏭️  Skipped: ${leaveSkipped}\n`)

// Step 2: Migrate flight requests
console.log('📋 Step 2: Migrating flight requests...\n')

const { data: oldFlightRequests, error: flightError } = await supabase
  .from('flight_requests')
  .select('*')
  .order('created_at', { ascending: true })

if (flightError) {
  console.error('❌ Failed to fetch flight_requests:', flightError.message)
  process.exit(1)
}

console.log(`   Found ${oldFlightRequests.length} flight requests in old table`)

let flightMigrated = 0
let flightSkipped = 0

for (const oldReq of oldFlightRequests) {
  // Check if already migrated
  const { data: existing } = await supabase
    .from('pilot_requests')
    .select('id')
    .eq('pilot_id', oldReq.pilot_id)
    .eq('flight_date', oldReq.flight_date)
    .eq('request_category', 'FLIGHT')
    .maybeSingle()

  if (existing) {
    flightSkipped++
    continue
  }

  // Get pilot details
  const pilotDetails = await getPilotDetails(oldReq.pilot_id)
  if (!pilotDetails) {
    console.error(`   ⚠️  Skipping - no pilot found for ${oldReq.pilot_id}`)
    flightSkipped++
    continue
  }

  // Calculate roster period and related dates from flight_date
  const rosterPeriod = getRosterPeriodFromDate(oldReq.flight_date)
  const rosterDates = calculateRosterPeriodDates(oldReq.flight_date)

  // Calculate submission date (use created_at)
  const submissionDate = oldReq.created_at
    ? new Date(oldReq.created_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  // Calculate if late request (submitted after deadline)
  const deadlineDate = new Date(rosterDates.deadlineDate)
  const submittedDate = new Date(submissionDate)
  const isLateRequest = submittedDate > deadlineDate
  const isPastDeadline = isLateRequest

  // Map old schema to new schema
  const newRequest = {
    pilot_id: oldReq.pilot_id,
    employee_number: pilotDetails.employee_number,
    rank: pilotDetails.rank,
    name: pilotDetails.name,
    request_category: 'FLIGHT',
    request_type: oldReq.request_type || 'FLIGHT_REQUEST',
    submission_channel: 'ADMIN_PORTAL',
    start_date: oldReq.flight_date, // Use flight_date as start_date
    flight_date: oldReq.flight_date,
    roster_period: rosterPeriod,
    roster_period_start_date: rosterDates.startDate,
    roster_publish_date: rosterDates.publishDate,
    roster_deadline_date: rosterDates.deadlineDate,
    submission_date: submissionDate,
    is_late_request: isLateRequest,
    is_past_deadline: isPastDeadline,
    days_count: null, // Flight requests don't have days_count
    priority_score: 0, // Default priority score
    conflict_flags: [], // Empty conflict flags initially
    workflow_status: mapStatusToWorkflowStatus(oldReq.status || 'PENDING'), // Map old status to new workflow_status
    reason: oldReq.description,
    notes: `Migrated from flight_requests table on ${new Date().toISOString()}`,
    created_at: oldReq.created_at,
    updated_at: oldReq.updated_at,
  }

  // Insert into pilot_requests
  const { error: insertError } = await supabase.from('pilot_requests').insert(newRequest)

  if (insertError) {
    console.error(`   ❌ Failed to migrate flight request ${oldReq.id}:`, insertError.message)
    flightSkipped++
  } else {
    flightMigrated++
  }
}

console.log(`   ✅ Migrated: ${flightMigrated}`)
console.log(`   ⏭️  Skipped: ${flightSkipped}\n`)

// Step 3: Verify migration
console.log('📊 Step 3: Verifying migration...\n')

const { data: finalCount } = await supabase
  .from('pilot_requests')
  .select('id', { count: 'exact', head: true })

const { data: leaveCount } = await supabase
  .from('pilot_requests')
  .select('id', { count: 'exact', head: true })
  .eq('request_category', 'LEAVE')

const { data: flightCount } = await supabase
  .from('pilot_requests')
  .select('id', { count: 'exact', head: true })
  .eq('request_category', 'FLIGHT')

console.log('=== MIGRATION COMPLETE ===\n')
console.log(`Total records migrated:`)
console.log(`   Leave requests:  ${leaveMigrated}`)
console.log(`   Flight requests: ${flightMigrated}`)
console.log(`   Total:           ${leaveMigrated + flightMigrated}\n`)

console.log(`Final pilot_requests table:`)
console.log(`   Total records:   ${finalCount}`)
console.log(`   LEAVE category:  ${leaveCount}`)
console.log(`   FLIGHT category: ${flightCount}\n`)

console.log('✅ Migration successful! All old data has been migrated to pilot_requests table.')
