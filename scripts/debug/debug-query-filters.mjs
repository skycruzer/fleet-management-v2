/**
 * Debug Query Filters
 * Test what filters are being applied and what data is returned
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== Testing Query with Filters ===\n')

// Simulate the exact query from reports-service.ts
console.log('1. Testing base query (no filters):')
const { data: baseData, error: baseError } = await supabase
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
  .order('start_date', { ascending: false })

if (baseError) {
  console.error('   ❌ Error:', baseError.message)
} else {
  console.log(`   ✅ Found ${baseData?.length || 0} leave requests`)
  if (baseData && baseData.length > 0) {
    console.log('\n   Sample record:')
    console.log('   - ID:', baseData[0].id)
    console.log('   - Start Date:', baseData[0].start_date)
    console.log('   - End Date:', baseData[0].end_date)
    console.log('   - Roster Period:', baseData[0].roster_period)
    console.log('   - Workflow Status:', baseData[0].workflow_status)
    console.log('   - Pilot:', baseData[0].pilots ? 'JOINED ✅' : 'MISSING ❌')
    if (baseData[0].pilots) {
      console.log('   - Pilot Name:', `${baseData[0].pilots.first_name} ${baseData[0].pilots.last_name}`)
      console.log('   - Pilot Role:', baseData[0].pilots.role)
    }
  }
}

// Test with roster period filter like the UI would send
console.log('\n2. Testing with roster period RP01/2026:')
const { data: rpData, error: rpError } = await supabase
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
  .eq('roster_period', 'RP01/2026')
  .order('start_date', { ascending: false })

if (rpError) {
  console.error('   ❌ Error:', rpError.message)
} else {
  console.log(`   ✅ Found ${rpData?.length || 0} leave requests for RP01/2026`)
}

// Test with date range filter (what rosterPeriodsToDateRange would produce)
console.log('\n3. Testing with date range filter:')
console.log('   Date range: 2026-01-10 to 2026-02-06')
const { data: dateData, error: dateError } = await supabase
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
  .gte('start_date', '2026-01-10')
  .lte('end_date', '2026-02-06')
  .order('start_date', { ascending: false })

if (dateError) {
  console.error('   ❌ Error:', dateError.message)
} else {
  console.log(`   ✅ Found ${dateData?.length || 0} leave requests in date range`)
  if (dateData && dateData.length > 0) {
    console.log('\n   Matching records:')
    dateData.forEach(req => {
      console.log(`   - ${req.roster_period}: ${req.pilots?.first_name} ${req.pilots?.last_name} (${req.start_date} to ${req.end_date})`)
    })
  }
}

// List all roster periods in the database
console.log('\n4. All roster periods in database:')
const { data: allData } = await supabase
  .from('pilot_requests')
  .select('roster_period')
  .eq('request_category', 'LEAVE')

if (allData) {
  const uniquePeriods = [...new Set(allData.map(r => r.roster_period))].sort()
  console.log('   Unique roster periods:', uniquePeriods.join(', '))
}

console.log('\n5. Diagnosis:')
console.log('   - If base query returns data but filtered query does not,')
console.log('     the issue is with the filter logic')
console.log('   - Check rosterPeriodsToDateRange() function')
console.log('   - Verify UI is sending correct filter values')
