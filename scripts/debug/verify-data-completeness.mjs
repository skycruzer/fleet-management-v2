/**
 * Comprehensive Database Verification Script
 *
 * Verifies data completeness and accuracy between old and new tables:
 * - Checks for missing records
 * - Validates field mappings
 * - Identifies orphaned data
 * - Compares record counts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== COMPREHENSIVE DATABASE VERIFICATION ===\n')

// ============================================================================
// STEP 1: Check all old tables for records
// ============================================================================
console.log('📊 STEP 1: Checking old tables for all records...\n')

// Check old leave_requests table
const { data: oldLeaveRequests, error: oldLeaveError } = await supabase
  .from('leave_requests')
  .select('*')
  .order('created_at', { ascending: true })

if (oldLeaveError) {
  console.error('❌ Error fetching leave_requests:', oldLeaveError.message)
} else {
  console.log(`📋 Old leave_requests table: ${oldLeaveRequests.length} records`)

  // Group by status
  const leaveByStatus = oldLeaveRequests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1
    return acc
  }, {})

  console.log('   Status breakdown:')
  Object.entries(leaveByStatus).forEach(([status, count]) => {
    console.log(`     - ${status}: ${count}`)
  })
  console.log()
}

// Check old flight_requests table
const { data: oldFlightRequests, error: oldFlightError } = await supabase
  .from('flight_requests')
  .select('*')
  .order('created_at', { ascending: true })

if (oldFlightError) {
  console.error('❌ Error fetching flight_requests:', oldFlightError.message)
} else {
  console.log(`✈️  Old flight_requests table: ${oldFlightRequests.length} records`)

  if (oldFlightRequests.length > 0) {
    // Group by status
    const flightByStatus = oldFlightRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1
      return acc
    }, {})

    console.log('   Status breakdown:')
    Object.entries(flightByStatus).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`)
    })
  }
  console.log()
}

// ============================================================================
// STEP 2: Check new unified pilot_requests table
// ============================================================================
console.log('📊 STEP 2: Checking new pilot_requests table...\n')

const { data: pilotRequests, error: pilotRequestsError } = await supabase
  .from('pilot_requests')
  .select('*')
  .order('created_at', { ascending: true })

if (pilotRequestsError) {
  console.error('❌ Error fetching pilot_requests:', pilotRequestsError.message)
} else {
  console.log(`📦 New pilot_requests table: ${pilotRequests.length} total records`)

  // Group by category
  const byCategory = pilotRequests.reduce((acc, req) => {
    acc[req.request_category] = (acc[req.request_category] || 0) + 1
    return acc
  }, {})

  console.log('   Category breakdown:')
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`     - ${category}: ${count}`)
  })

  // Group by submission channel
  const byChannel = pilotRequests.reduce((acc, req) => {
    const channel = req.submission_channel || 'UNKNOWN'
    acc[channel] = (acc[channel] || 0) + 1
    return acc
  }, {})

  console.log('   Submission channel:')
  Object.entries(byChannel).forEach(([channel, count]) => {
    console.log(`     - ${channel}: ${count}`)
  })

  // Group by workflow_status
  const byStatus = pilotRequests.reduce((acc, req) => {
    acc[req.workflow_status] = (acc[req.workflow_status] || 0) + 1
    return acc
  }, {})

  console.log('   Workflow status:')
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`     - ${status}: ${count}`)
  })
  console.log()
}

// ============================================================================
// STEP 3: Cross-reference old leave_requests with pilot_requests
// ============================================================================
console.log('🔍 STEP 3: Cross-referencing leave_requests...\n')

let missingLeaveCount = 0
const missingLeaveRecords = []

for (const oldReq of oldLeaveRequests) {
  // Try to find matching record in pilot_requests
  const matches = pilotRequests.filter(
    (pr) =>
      pr.request_category === 'LEAVE' &&
      pr.pilot_id === oldReq.pilot_id &&
      pr.start_date === oldReq.start_date &&
      pr.end_date === oldReq.end_date
  )

  if (matches.length === 0) {
    missingLeaveCount++
    missingLeaveRecords.push({
      id: oldReq.id,
      pilot_id: oldReq.pilot_id,
      start_date: oldReq.start_date,
      end_date: oldReq.end_date,
      leave_type: oldReq.leave_type,
      status: oldReq.status,
      created_at: oldReq.created_at,
    })
  } else if (matches.length > 1) {
    console.log(
      `⚠️  WARNING: Found ${matches.length} duplicate matches for leave request ${oldReq.id}`
    )
  }
}

if (missingLeaveCount === 0) {
  console.log('✅ All leave_requests records found in pilot_requests!')
} else {
  console.log(`❌ MISSING ${missingLeaveCount} leave_requests records:`)
  missingLeaveRecords.forEach((rec, idx) => {
    console.log(`\n   ${idx + 1}. Leave Request ID: ${rec.id}`)
    console.log(`      Pilot ID: ${rec.pilot_id}`)
    console.log(`      Dates: ${rec.start_date} to ${rec.end_date}`)
    console.log(`      Type: ${rec.leave_type || 'N/A'}`)
    console.log(`      Status: ${rec.status}`)
    console.log(`      Created: ${rec.created_at}`)
  })
}
console.log()

// ============================================================================
// STEP 4: Cross-reference old flight_requests with pilot_requests
// ============================================================================
console.log('🔍 STEP 4: Cross-referencing flight_requests...\n')

let missingFlightCount = 0
const missingFlightRecords = []

for (const oldReq of oldFlightRequests) {
  // Try to find matching record in pilot_requests
  const matches = pilotRequests.filter(
    (pr) =>
      pr.request_category === 'FLIGHT' &&
      pr.pilot_id === oldReq.pilot_id &&
      pr.flight_date === oldReq.flight_date
  )

  if (matches.length === 0) {
    missingFlightCount++
    missingFlightRecords.push({
      id: oldReq.id,
      pilot_id: oldReq.pilot_id,
      flight_date: oldReq.flight_date,
      request_type: oldReq.request_type,
      description: oldReq.description,
      status: oldReq.status,
      created_at: oldReq.created_at,
    })
  } else if (matches.length > 1) {
    console.log(
      `⚠️  WARNING: Found ${matches.length} duplicate matches for flight request ${oldReq.id}`
    )
  }
}

if (missingFlightCount === 0) {
  console.log('✅ All flight_requests records found in pilot_requests!')
} else {
  console.log(`❌ MISSING ${missingFlightCount} flight_requests records:`)
  missingFlightRecords.forEach((rec, idx) => {
    console.log(`\n   ${idx + 1}. Flight Request ID: ${rec.id}`)
    console.log(`      Pilot ID: ${rec.pilot_id}`)
    console.log(`      Flight Date: ${rec.flight_date}`)
    console.log(`      Type: ${rec.request_type}`)
    console.log(`      Description: ${rec.description?.substring(0, 50)}...`)
    console.log(`      Status: ${rec.status}`)
    console.log(`      Created: ${rec.created_at}`)
  })
}
console.log()

// ============================================================================
// STEP 5: Check for orphaned records (invalid pilot_id)
// ============================================================================
console.log('🔍 STEP 5: Checking for orphaned records...\n')

// Get all valid pilot IDs
const { data: pilots, error: pilotsError } = await supabase
  .from('pilots')
  .select('id, employee_id, first_name, last_name, role')

if (pilotsError) {
  console.error('❌ Error fetching pilots:', pilotsError.message)
} else {
  const validPilotIds = new Set(pilots.map((p) => p.id))

  // Check old leave_requests
  const orphanedLeave = oldLeaveRequests.filter((req) => !validPilotIds.has(req.pilot_id))
  if (orphanedLeave.length > 0) {
    console.log(`⚠️  Found ${orphanedLeave.length} orphaned leave_requests (invalid pilot_id):`)
    orphanedLeave.forEach((req) => {
      console.log(`   - ${req.id}: pilot_id = ${req.pilot_id}`)
    })
  } else {
    console.log('✅ No orphaned leave_requests found')
  }

  // Check old flight_requests
  const orphanedFlight = oldFlightRequests.filter((req) => !validPilotIds.has(req.pilot_id))
  if (orphanedFlight.length > 0) {
    console.log(`⚠️  Found ${orphanedFlight.length} orphaned flight_requests (invalid pilot_id):`)
    orphanedFlight.forEach((req) => {
      console.log(`   - ${req.id}: pilot_id = ${req.pilot_id}`)
    })
  } else {
    console.log('✅ No orphaned flight_requests found')
  }

  // Check new pilot_requests
  const orphanedPilotRequests = pilotRequests.filter((req) => !validPilotIds.has(req.pilot_id))
  if (orphanedPilotRequests.length > 0) {
    console.log(
      `⚠️  Found ${orphanedPilotRequests.length} orphaned pilot_requests (invalid pilot_id):`
    )
    orphanedPilotRequests.forEach((req) => {
      console.log(`   - ${req.id}: pilot_id = ${req.pilot_id}, category = ${req.request_category}`)
    })
  } else {
    console.log('✅ No orphaned pilot_requests found')
  }
}
console.log()

// ============================================================================
// STEP 6: Verify status mapping accuracy
// ============================================================================
console.log('🔍 STEP 6: Verifying status mapping accuracy...\n')

// Check if status values were correctly mapped
const statusIssues = []

for (const oldReq of oldLeaveRequests) {
  const matches = pilotRequests.filter(
    (pr) =>
      pr.request_category === 'LEAVE' &&
      pr.pilot_id === oldReq.pilot_id &&
      pr.start_date === oldReq.start_date &&
      pr.end_date === oldReq.end_date
  )

  if (matches.length === 1) {
    const newReq = matches[0]
    const expectedStatus =
      {
        PENDING: 'SUBMITTED',
        APPROVED: 'APPROVED',
        REJECTED: 'DENIED',
      }[oldReq.status] || 'SUBMITTED'

    if (newReq.workflow_status !== expectedStatus) {
      statusIssues.push({
        oldId: oldReq.id,
        newId: newReq.id,
        oldStatus: oldReq.status,
        newStatus: newReq.workflow_status,
        expectedStatus,
      })
    }
  }
}

for (const oldReq of oldFlightRequests) {
  const matches = pilotRequests.filter(
    (pr) =>
      pr.request_category === 'FLIGHT' &&
      pr.pilot_id === oldReq.pilot_id &&
      pr.flight_date === oldReq.flight_date
  )

  if (matches.length === 1) {
    const newReq = matches[0]
    const expectedStatus =
      {
        PENDING: 'SUBMITTED',
        APPROVED: 'APPROVED',
        REJECTED: 'DENIED',
      }[oldReq.status] || 'SUBMITTED'

    if (newReq.workflow_status !== expectedStatus) {
      statusIssues.push({
        oldId: oldReq.id,
        newId: newReq.id,
        oldStatus: oldReq.status,
        newStatus: newReq.workflow_status,
        expectedStatus,
      })
    }
  }
}

if (statusIssues.length === 0) {
  console.log('✅ All status values correctly mapped!')
} else {
  console.log(`❌ Found ${statusIssues.length} status mapping issues:`)
  statusIssues.forEach((issue) => {
    console.log(`   - Old ID ${issue.oldId} → New ID ${issue.newId}`)
    console.log(`     Old status: ${issue.oldStatus}`)
    console.log(`     Expected: ${issue.expectedStatus}`)
    console.log(`     Actual: ${issue.newStatus}`)
  })
}
console.log()

// ============================================================================
// STEP 7: Summary
// ============================================================================
console.log('='.repeat(70))
console.log('📊 VERIFICATION SUMMARY')
console.log('='.repeat(70))
console.log()
console.log(`Total old leave_requests:     ${oldLeaveRequests.length}`)
console.log(`Total old flight_requests:    ${oldFlightRequests.length}`)
console.log(`Total old records:            ${oldLeaveRequests.length + oldFlightRequests.length}`)
console.log()
console.log(`Total pilot_requests:         ${pilotRequests.length}`)
console.log(
  `  - LEAVE category:           ${pilotRequests.filter((r) => r.request_category === 'LEAVE').length}`
)
console.log(
  `  - FLIGHT category:          ${pilotRequests.filter((r) => r.request_category === 'FLIGHT').length}`
)
console.log()
console.log(`Missing leave records:        ${missingLeaveCount}`)
console.log(`Missing flight records:       ${missingFlightCount}`)
console.log(`Total missing:                ${missingLeaveCount + missingFlightCount}`)
console.log()
console.log(`Status mapping issues:        ${statusIssues.length}`)
console.log()

if (missingLeaveCount === 0 && missingFlightCount === 0 && statusIssues.length === 0) {
  console.log('🎉 VERIFICATION PASSED: All data accounted for and accurate!')
} else {
  console.log('⚠️  VERIFICATION FAILED: Issues found (see details above)')

  if (missingLeaveCount > 0 || missingFlightCount > 0) {
    console.log('\n💡 Run the migration script again to fix missing records:')
    console.log('   node migrate-missing-data.mjs')
  }
}
console.log()
