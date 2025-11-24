/**
 * Comprehensive Reports Debug
 * Check all possible filter combinations
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== COMPREHENSIVE REPORTS DEBUG ===\n')

// 1. Check total leave requests
console.log('1. Total leave requests in database:')
const { data: allLeave, error: allLeaveError } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'LEAVE')

if (allLeaveError) {
  console.error('   ❌ Error:', allLeaveError.message)
} else {
  console.log(`   ✅ Total: ${allLeave?.length || 0} leave requests`)

  // Group by roster period
  const byPeriod = {}
  allLeave?.forEach(req => {
    const period = req.roster_period || 'NO_PERIOD'
    byPeriod[period] = (byPeriod[period] || 0) + 1
  })

  console.log('\n   By roster period:')
  Object.entries(byPeriod).sort().forEach(([period, count]) => {
    console.log(`   - ${period}: ${count} requests`)
  })

  // Group by workflow_status
  const byStatus = {}
  allLeave?.forEach(req => {
    const status = req.workflow_status || 'NO_STATUS'
    byStatus[status] = (byStatus[status] || 0) + 1
  })

  console.log('\n   By workflow_status:')
  Object.entries(byStatus).sort().forEach(([status, count]) => {
    console.log(`   - ${status}: ${count} requests`)
  })
}

// 2. Test exact UI filter scenario
console.log('\n\n2. Testing UI filter scenario (RP01/2026, RP02/2026):')
const { data: filtered, error: filterError } = await supabase
  .from('pilot_requests')
  .select(`
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `)
  .eq('request_category', 'LEAVE')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])
  .order('start_date', { ascending: false })

if (filterError) {
  console.error('   ❌ Error:', filterError.message)
} else {
  console.log(`   ✅ Found ${filtered?.length || 0} requests`)

  if (filtered && filtered.length > 0) {
    console.log('\n   Details:')
    filtered.forEach(req => {
      const pilotName = req.pilots ? `${req.pilots.first_name} ${req.pilots.last_name}` : 'NO PILOT'
      const rank = req.pilots?.role || 'NO RANK'
      console.log(`   - ${req.roster_period} | ${pilotName} (${rank}) | ${req.workflow_status} | ${req.start_date} to ${req.end_date}`)
    })
  }
}

// 3. Test with different status filters
console.log('\n\n3. Testing status filters:')

const statuses = ['PENDING', 'SUBMITTED', 'APPROVED', 'DENIED', 'REJECTED']
for (const status of statuses) {
  const { data, error } = await supabase
    .from('pilot_requests')
    .select('id')
    .eq('request_category', 'LEAVE')
    .in('roster_period', ['RP01/2026', 'RP02/2026'])
    .eq('workflow_status', status)

  if (!error && data) {
    console.log(`   - ${status}: ${data.length} requests`)
  }
}

// 4. Check if there's a mismatch in status values
console.log('\n\n4. Checking actual workflow_status values in RP01/2026 and RP02/2026:')
const { data: statusCheck } = await supabase
  .from('pilot_requests')
  .select('workflow_status')
  .eq('request_category', 'LEAVE')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])

if (statusCheck) {
  const uniqueStatuses = [...new Set(statusCheck.map(r => r.workflow_status))].sort()
  console.log('   Unique statuses found:', uniqueStatuses.join(', '))
}

// 5. Test without status filter (what UI should send if "All" is selected)
console.log('\n\n5. Testing WITHOUT status filter (All statuses):')
const { data: noStatusFilter, error: noStatusError } = await supabase
  .from('pilot_requests')
  .select(`
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `)
  .eq('request_category', 'LEAVE')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])
  .order('start_date', { ascending: false })

if (noStatusError) {
  console.error('   ❌ Error:', noStatusError.message)
} else {
  console.log(`   ✅ Found ${noStatusFilter?.length || 0} requests without status filter`)
}

// 6. Flight requests check
console.log('\n\n6. Testing flight requests for RP01/2026, RP02/2026:')
const { data: flightData, error: flightError } = await supabase
  .from('pilot_requests')
  .select(`
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `)
  .eq('request_category', 'FLIGHT')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])

if (flightError) {
  console.error('   ❌ Error:', flightError.message)
} else {
  console.log(`   ✅ Found ${flightData?.length || 0} flight requests`)

  if (flightData && flightData.length > 0) {
    console.log('\n   Details:')
    flightData.forEach(req => {
      const pilotName = req.pilots ? `${req.pilots.first_name} ${req.pilots.last_name}` : 'NO PILOT'
      const rank = req.pilots?.role || 'NO RANK'
      console.log(`   - ${req.roster_period} | ${pilotName} (${rank}) | ${req.request_type} | ${req.flight_date || req.start_date}`)
    })
  }
}

console.log('\n\n=== SUMMARY ===')
console.log('If you see data here but not in the UI:')
console.log('1. Check browser console for JavaScript errors')
console.log('2. Clear browser cache (Cmd/Ctrl + Shift + R)')
console.log('3. Check Network tab to see what filters the UI is actually sending')
console.log('4. Verify you are logged in as admin')
