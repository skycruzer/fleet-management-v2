import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== Searching for Request Data Across All Tables ===\n')

// Check pilot_requests
console.log('1. pilot_requests table:')
const { count: prCount, error: prError } = await supabase
  .from('pilot_requests')
  .select('*', { count: 'exact', head: true })
console.log(`   Total records: ${prCount}`)
if (prCount > 0) {
  const { data: prData } = await supabase
    .from('pilot_requests')
    .select('id, employee_number, request_category, start_date, end_date, workflow_status')
    .limit(5)
  console.log('   Sample records:', JSON.stringify(prData, null, 2))
}

// Check leave_requests (deprecated)
console.log('\n2. leave_requests (deprecated) table:')
const { count: lrCount } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })
console.log(`   Total records: ${lrCount}`)
if (lrCount > 0) {
  const { data: lrData } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, request_type, start_date, end_date, status')
    .limit(5)
  console.log('   Sample records:', JSON.stringify(lrData, null, 2))
}

// Check flight_requests (deprecated)
console.log('\n3. flight_requests (deprecated) table:')
const { count: frCount } = await supabase
  .from('flight_requests')
  .select('*', { count: 'exact', head: true })
console.log(`   Total records: ${frCount}`)
if (frCount > 0) {
  const { data: frData } = await supabase
    .from('flight_requests')
    .select('id, pilot_id, start_date, end_date, status')
    .limit(5)
  console.log('   Sample records:', JSON.stringify(frData, null, 2))
}

// Check pilots table
console.log('\n4. pilots table:')
const { count: pCount } = await supabase.from('pilots').select('*', { count: 'exact', head: true })
console.log(`   Total records: ${pCount}`)
const { data: pilotsSample } = await supabase
  .from('pilots')
  .select('id, employee_number, first_name, last_name, role')
  .limit(3)
console.log('   Sample records:', JSON.stringify(pilotsSample, null, 2))

// Check if there are any tables with 8 records (matching user screenshot)
console.log('\n5. Checking for tables with ~8 records...')
const tables = ['pilot_requests', 'leave_requests', 'flight_requests', 'leave_bids', 'tasks']
for (const table of tables) {
  try {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (count >= 7 && count <= 10) {
      console.log(`   ✅ ${table} has ${count} records`)
      const { data } = await supabase.from(table).select('*').limit(2)
      console.log(`   Sample:`, JSON.stringify(data, null, 2))
    }
  } catch (err) {
    // Skip tables that don't exist
  }
}
