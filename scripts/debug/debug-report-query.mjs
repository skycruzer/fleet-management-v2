import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🔍 Debugging Report Query Issues\n')

// Get ALL leave requests without any filters
console.log('1️⃣ Testing: NO FILTERS (should show all 20 records)\n')
const { data: all, error: err1 } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)')

console.log(`Result: ${all?.length || 0} records`)
if (err1) console.error('Error:', err1.message)
console.log()

// Test with submission method filter
console.log('2️⃣ Testing: Submission Method = SYSTEM, EMAIL, ORACLE, LEAVE_BIDS\n')
const { data: withMethod, error: err2 } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)')
  .in('request_method', ['SYSTEM', 'EMAIL', 'ORACLE', 'LEAVE_BIDS'])

console.log(`Result: ${withMethod?.length || 0} records`)
if (err2) console.error('Error:', err2.message)
console.log()

// Test with status filter
console.log('3️⃣ Testing: Status = pending, approved, rejected\n')
const { data: withStatus, error: err3 } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)')
  .in('status', ['pending', 'approved', 'rejected'])

console.log(`Result: ${withStatus?.length || 0} records`)
if (err3) console.error('Error:', err3.message)
console.log()

// Test with rank filter (client-side)
console.log('4️⃣ Testing: Rank = Captain, First Officer (client-side filter)\n')
const { data: withRank, error: err4 } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)')

const filtered = withRank?.filter((r) => ['Captain', 'First Officer'].includes(r.pilot?.role))
console.log(`Result: ${filtered?.length || 0} records`)
if (err4) console.error('Error:', err4.message)
console.log()

// Test with roster period filter
console.log('5️⃣ Testing: Roster Period = RP1/2026\n')
const { data: withRP, error: err5 } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, role)')
  .in('roster_period', ['RP1/2026'])

console.log(`Result: ${withRP?.length || 0} records`)
if (err5) console.error('Error:', err5.message)
console.log()

// Show sample data from all records
if (all && all.length > 0) {
  console.log('📋 Sample Data (First 3 records):\n')
  all.slice(0, 3).forEach((r, i) => {
    console.log(`Record ${i + 1}:`)
    console.log(`  Pilot: ${r.pilot?.first_name} ${r.pilot?.last_name} (${r.pilot?.role})`)
    console.log(`  Type: ${r.request_type}`)
    console.log(`  Status: ${r.status}`)
    console.log(`  Method: ${r.request_method}`)
    console.log(`  Dates: ${r.start_date} to ${r.end_date}`)
    console.log(`  Roster: ${r.roster_period}`)
    console.log()
  })
}

// Check if pilot data is missing
const withoutPilot = all?.filter((r) => !r.pilot)
if (withoutPilot && withoutPilot.length > 0) {
  console.log(`⚠️  WARNING: ${withoutPilot.length} records have NULL pilot data!`)
}

process.exit(0)
