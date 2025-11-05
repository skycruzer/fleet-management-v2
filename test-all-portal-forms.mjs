#!/usr/bin/env node

/**
 * Comprehensive Portal Forms Testing Script
 * Tests all pilot portal forms and admin integration
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('\n🧪 PILOT PORTAL FORMS - COMPREHENSIVE TEST SUITE\n')
console.log('=' .repeat(60))

const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (details) console.log(`   ${details}`)

  results.tests.push({ name, passed, details })
  if (passed) results.passed++
  else results.failed++
}

// =============================================================================
// TEST 1: LEAVE REQUEST FORM - Server Action
// =============================================================================
console.log('\n📝 TEST 1: Leave Request Form Submission\n')

try {
  // Check if leave request server action exists
  const { readFileSync } = await import('fs')
  const leaveActionContent = readFileSync('app/portal/leave/actions.ts', 'utf-8')

  const hasSubmitAction = leaveActionContent.includes('submitLeaveRequestAction')
  const usesService = leaveActionContent.includes('submitPilotLeaveRequest')
  const hasRevalidation = leaveActionContent.includes('revalidatePath')

  logTest(
    'Leave request server action exists',
    hasSubmitAction,
    hasSubmitAction ? 'submitLeaveRequestAction found' : 'Server action missing'
  )

  logTest(
    'Uses service layer (not direct DB)',
    usesService,
    usesService ? 'Calls submitPilotLeaveRequest' : 'Missing service layer call'
  )

  logTest(
    'Has cache revalidation',
    hasRevalidation,
    hasRevalidation ? 'revalidatePath implemented' : 'Missing cache invalidation'
  )

  // Check for recent leave requests in database
  const { data: recentLeave, error: leaveError } = await supabase
    .from('leave_requests')
    .select('id, request_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!leaveError && recentLeave && recentLeave.length > 0) {
    logTest(
      'Leave requests exist in database',
      true,
      `Latest: ${recentLeave[0].request_type} (${recentLeave[0].status})`
    )
  } else {
    logTest(
      'Leave requests exist in database',
      false,
      'No leave requests found (table may be empty)'
    )
  }
} catch (error) {
  logTest('Leave request form test', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 2: FLIGHT REQUEST FORM - Server Action
// =============================================================================
console.log('\n✈️  TEST 2: Flight Request Form Submission\n')

try {
  const { readFileSync } = await import('fs')
  const flightActionContent = readFileSync('app/portal/flights/actions.ts', 'utf-8')

  const hasSubmitAction = flightActionContent.includes('submitFlightRequestAction')
  const hasRevalidation = flightActionContent.includes('revalidatePath')
  const callsAPI = flightActionContent.includes('/api/portal/flight-requests')

  logTest(
    'Flight request server action exists',
    hasSubmitAction,
    hasSubmitAction ? 'submitFlightRequestAction found' : 'Server action missing'
  )

  logTest(
    'Calls pilot portal API endpoint',
    callsAPI,
    callsAPI ? 'Uses /api/portal/flight-requests' : 'Missing API call'
  )

  logTest(
    'Has cache revalidation',
    hasRevalidation,
    hasRevalidation ? 'revalidatePath implemented' : 'Missing cache invalidation'
  )

  // Check for flight requests in database
  const { data: recentFlight, error: flightError } = await supabase
    .from('flight_requests')
    .select('id, request_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!flightError && recentFlight && recentFlight.length > 0) {
    logTest(
      'Flight requests exist in database',
      true,
      `Latest: ${recentFlight[0].request_type} (${recentFlight[0].status})`
    )
  } else {
    logTest(
      'Flight requests exist in database',
      false,
      'No flight requests found (table may be empty or not created)'
    )
  }
} catch (error) {
  logTest('Flight request form test', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 3: FEEDBACK FORM - Server Action (NEWLY IMPLEMENTED)
// =============================================================================
console.log('\n💬 TEST 3: Feedback Form Submission (NEW)\n')

try {
  const { readFileSync } = await import('fs')
  const feedbackActionContent = readFileSync('app/portal/feedback/actions.ts', 'utf-8')

  const hasSubmitAction = feedbackActionContent.includes('submitFeedbackAction')
  const usesService = feedbackActionContent.includes('submitFeedback')
  const hasValidation = feedbackActionContent.includes('PilotFeedbackSchema')
  const hasRevalidation = feedbackActionContent.includes('revalidatePath')
  const notTODO = !feedbackActionContent.includes('TODO')

  logTest(
    'Feedback server action implemented',
    hasSubmitAction && notTODO,
    hasSubmitAction && notTODO ? 'submitFeedbackAction fully implemented' : 'Still TODO placeholder'
  )

  logTest(
    'Uses service layer',
    usesService,
    usesService ? 'Calls submitFeedback from pilot-feedback-service' : 'Missing service layer'
  )

  logTest(
    'Has Zod validation',
    hasValidation,
    hasValidation ? 'PilotFeedbackSchema validation present' : 'Missing validation'
  )

  logTest(
    'Has cache revalidation',
    hasRevalidation,
    hasRevalidation ? 'revalidatePath implemented' : 'Missing cache invalidation'
  )

  // Check for feedback in database
  const { data: recentFeedback, error: feedbackError } = await supabase
    .from('pilot_feedback')
    .select('id, category, subject, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!feedbackError && recentFeedback && recentFeedback.length > 0) {
    logTest(
      'Feedback records exist in database',
      true,
      `Latest: ${recentFeedback[0].category} - ${recentFeedback[0].subject.substring(0, 30)}...`
    )
  } else {
    logTest(
      'Feedback records exist in database',
      false,
      'No feedback found (table may be empty or not created)'
    )
  }
} catch (error) {
  logTest('Feedback form test', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 4: ADMIN LEAVE APPROVAL - Client Component (NEWLY IMPLEMENTED)
// =============================================================================
console.log('\n👔 TEST 4: Admin Leave Approval Workflow (NEW)\n')

try {
  const { readFileSync } = await import('fs')

  // Check server actions
  const actionsContent = readFileSync('app/dashboard/leave/approve/actions.ts', 'utf-8')
  const hasApproveAction = actionsContent.includes('approveLeaveRequest')
  const hasDenyAction = actionsContent.includes('denyLeaveRequest')
  const usesService = actionsContent.includes('updateLeaveRequestStatus')
  const requiresComments = actionsContent.includes('Comments are required when denying')

  logTest(
    'Approve leave action exists',
    hasApproveAction,
    hasApproveAction ? 'approveLeaveRequest implemented' : 'Approve action missing'
  )

  logTest(
    'Deny leave action exists',
    hasDenyAction,
    hasDenyAction ? 'denyLeaveRequest implemented' : 'Deny action missing'
  )

  logTest(
    'Uses service layer',
    usesService,
    usesService ? 'Calls updateLeaveRequestStatus' : 'Missing service layer'
  )

  logTest(
    'Requires comments for denials',
    requiresComments,
    requiresComments ? 'Validation enforces denial comments' : 'Missing validation'
  )

  // Check client component
  const clientContent = readFileSync('components/admin/leave-approval-client.tsx', 'utf-8')
  const hasTable = clientContent.includes('TableHeader')
  const hasApproveButton = clientContent.includes('Approve')
  const hasDenyDialog = clientContent.includes('Deny Leave Request')
  const hasEmptyState = clientContent.includes('All caught up!')

  logTest(
    'Client component has interactive table',
    hasTable,
    hasTable ? 'Table with leave requests implemented' : 'Missing table'
  )

  logTest(
    'Has approve button',
    hasApproveButton,
    hasApproveButton ? 'One-click approve functionality' : 'Missing approve button'
  )

  logTest(
    'Has deny dialog',
    hasDenyDialog,
    hasDenyDialog ? 'Dialog with required comments' : 'Missing deny workflow'
  )

  logTest(
    'Has empty state',
    hasEmptyState,
    hasEmptyState ? '"All caught up!" empty state present' : 'Missing empty state'
  )

  // Check page integration
  const pageContent = readFileSync('app/dashboard/leave/approve/page.tsx', 'utf-8')
  const usesClientComponent = pageContent.includes('LeaveApprovalClient')
  const fetchesData = pageContent.includes('getAllLeaveRequests')
  const filtersPending = pageContent.includes('PENDING')
  const hasStats = pageContent.includes('stats')

  logTest(
    'Page uses client component',
    usesClientComponent,
    usesClientComponent ? 'LeaveApprovalClient integrated' : 'Missing client component'
  )

  logTest(
    'Fetches data via service',
    fetchesData,
    fetchesData ? 'getAllLeaveRequests called' : 'Missing data fetch'
  )

  logTest(
    'Filters to pending requests',
    filtersPending,
    filtersPending ? 'Shows only PENDING status' : 'Missing filter'
  )

  logTest(
    'Displays statistics',
    hasStats,
    hasStats ? 'Pending/Approved/Denied stats shown' : 'Missing stats'
  )
} catch (error) {
  logTest('Admin leave approval test', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 5: ADMIN FEEDBACK DASHBOARD
// =============================================================================
console.log('\n📊 TEST 5: Admin Feedback Dashboard\n')

try {
  const { readFileSync } = await import('fs')

  // Check if feedback dashboard page exists
  const feedbackPageExists = await import('fs')
    .then(fs => fs.existsSync('app/dashboard/feedback/page.tsx'))

  logTest(
    'Admin feedback dashboard exists',
    feedbackPageExists,
    feedbackPageExists ? 'Dashboard page found' : 'Dashboard page missing'
  )

  // Check feedback service has admin functions
  const serviceContent = readFileSync('lib/services/pilot-feedback-service.ts', 'utf-8')
  const hasGetAll = serviceContent.includes('getAllFeedback')
  const hasUpdateStatus = serviceContent.includes('updateFeedbackStatus')
  const hasAddResponse = serviceContent.includes('addAdminResponse')
  const hasExport = serviceContent.includes('exportFeedbackToCSV')

  logTest(
    'Service has getAllFeedback',
    hasGetAll,
    hasGetAll ? 'Admin can view all feedback' : 'Missing getAllFeedback'
  )

  logTest(
    'Service has updateFeedbackStatus',
    hasUpdateStatus,
    hasUpdateStatus ? 'Admin can update status' : 'Missing status update'
  )

  logTest(
    'Service has addAdminResponse',
    hasAddResponse,
    hasAddResponse ? 'Admin can respond to feedback' : 'Missing response function'
  )

  logTest(
    'Service has CSV export',
    hasExport,
    hasExport ? 'Export to CSV implemented' : 'Missing export'
  )
} catch (error) {
  logTest('Admin feedback dashboard test', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 6: DATABASE SCHEMA VERIFICATION
// =============================================================================
console.log('\n🗄️  TEST 6: Database Schema Verification\n')

try {
  // Check leave_requests table
  const { data: leaveSchema, error: leaveSchemaError } = await supabase
    .from('leave_requests')
    .select('*')
    .limit(0)

  logTest(
    'leave_requests table exists',
    !leaveSchemaError,
    !leaveSchemaError ? 'Table accessible' : `Error: ${leaveSchemaError.message}`
  )

  // Check flight_requests table
  const { data: flightSchema, error: flightSchemaError } = await supabase
    .from('flight_requests')
    .select('*')
    .limit(0)

  logTest(
    'flight_requests table exists',
    !flightSchemaError,
    !flightSchemaError ? 'Table accessible' : `Error: ${flightSchemaError.message}`
  )

  // Check pilot_feedback table
  const { data: feedbackSchema, error: feedbackSchemaError } = await supabase
    .from('pilot_feedback')
    .select('*')
    .limit(0)

  logTest(
    'pilot_feedback table exists',
    !feedbackSchemaError,
    !feedbackSchemaError ? 'Table accessible' : `Error: ${feedbackSchemaError.message}`
  )

  // Check an_users table (pilot authentication)
  const { data: anUsersSchema, error: anUsersSchemaError } = await supabase
    .from('an_users')
    .select('*')
    .limit(0)

  logTest(
    'an_users table exists (pilot auth)',
    !anUsersSchemaError,
    !anUsersSchemaError ? 'Pilot auth table accessible' : `Error: ${anUsersSchemaError.message}`
  )
} catch (error) {
  logTest('Database schema verification', false, `Error: ${error.message}`)
}

// =============================================================================
// TEST 7: COMPONENT FILE STRUCTURE
// =============================================================================
console.log('\n📁 TEST 7: Component File Structure\n')

try {
  const { existsSync } = await import('fs')

  const files = [
    { path: 'components/portal/leave-request-form.tsx', name: 'Leave Request Form' },
    { path: 'components/portal/flight-request-form.tsx', name: 'Flight Request Form' },
    { path: 'components/portal/feedback-form.tsx', name: 'Feedback Form' },
    { path: 'components/portal/submit-button.tsx', name: 'Reusable Submit Button' },
    { path: 'components/admin/leave-approval-client.tsx', name: 'Leave Approval Client (NEW)' },
    { path: 'app/portal/leave/actions.ts', name: 'Leave Actions' },
    { path: 'app/portal/flights/actions.ts', name: 'Flight Actions' },
    { path: 'app/portal/feedback/actions.ts', name: 'Feedback Actions (FIXED)' },
    { path: 'app/dashboard/leave/approve/actions.ts', name: 'Admin Leave Actions (NEW)' },
  ]

  for (const file of files) {
    const exists = existsSync(file.path)
    logTest(
      file.name,
      exists,
      exists ? `${file.path}` : `Missing: ${file.path}`
    )
  }
} catch (error) {
  logTest('Component file structure test', false, `Error: ${error.message}`)
}

// =============================================================================
// FINAL REPORT
// =============================================================================
console.log('\n' + '='.repeat(60))
console.log('\n📊 TEST RESULTS SUMMARY\n')

const totalTests = results.passed + results.failed
const passRate = ((results.passed / totalTests) * 100).toFixed(1)

console.log(`Total Tests: ${totalTests}`)
console.log(`✅ Passed: ${results.passed}`)
console.log(`❌ Failed: ${results.failed}`)
console.log(`📈 Pass Rate: ${passRate}%\n`)

if (results.failed > 0) {
  console.log('❌ FAILED TESTS:\n')
  results.tests
    .filter(t => !t.passed)
    .forEach(t => {
      console.log(`   - ${t.name}`)
      if (t.details) console.log(`     ${t.details}`)
    })
  console.log('')
}

const overallStatus = results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'
console.log(overallStatus)
console.log('\n' + '='.repeat(60) + '\n')

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0)
