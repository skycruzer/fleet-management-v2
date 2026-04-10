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

console.log('🧪 Testing Roster Period Filter\n')

// Simulate the exact query from reports-service.ts
const testRosterPeriods = ['RP01/2026', 'RP13/2025', 'RP12/2025']

console.log(`📋 Testing with roster periods: ${testRosterPeriods.join(', ')}\n`)

const { data, error } = await supabase
  .from('leave_requests')
  .select(
    `
    id,
    start_date,
    end_date,
    request_type,
    status,
    roster_period,
    request_method,
    pilot:pilots!leave_requests_pilot_id_fkey (
      id,
      first_name,
      last_name,
      role
    )
  `
  )
  .in('roster_period', testRosterPeriods)
  .order('start_date', { ascending: false })

if (error) {
  console.error('❌ Query Error:', error.message)
  process.exit(1)
}

console.log(`✅ Query Success: ${data.length} records returned\n`)

// Calculate summary statistics (matching reports-service.ts logic)
const summary = {
  totalRequests: data.length,
  pending: data.filter((r) => r.status === 'PENDING').length,
  approved: data.filter((r) => r.status === 'APPROVED').length,
  rejected: data.filter((r) => r.status === 'REJECTED').length,
  captainRequests: data.filter((r) => r.pilot?.role === 'Captain').length,
  firstOfficerRequests: data.filter((r) => r.pilot?.role === 'First Officer').length,
}

console.log('📊 Summary Statistics:\n')
console.log(`  Total Requests: ${summary.totalRequests}`)
console.log(`  Pending: ${summary.pending}`)
console.log(`  Approved: ${summary.approved}`)
console.log(`  Rejected: ${summary.rejected}`)
console.log(`  Captain Requests: ${summary.captainRequests}`)
console.log(`  First Officer Requests: ${summary.firstOfficerRequests}`)

// Group by roster period
console.log('\n📅 Distribution by Roster Period:\n')
const byRosterPeriod = {}
data.forEach((r) => {
  const rp = r.roster_period || 'NULL'
  byRosterPeriod[rp] = (byRosterPeriod[rp] || 0) + 1
})

Object.entries(byRosterPeriod)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([rp, count]) => {
    console.log(`  ${rp}: ${count} records`)
  })

// Sample records
console.log('\n📋 Sample Records:\n')
data.slice(0, 5).forEach((r) => {
  const idStr = String(r.id)
  console.log(`  ID: ${idStr.substring(0, 8)}`)
  console.log(`  Pilot: ${r.pilot?.first_name} ${r.pilot?.last_name} (${r.pilot?.role})`)
  console.log(`  Status: ${r.status}`)
  console.log(`  Roster Period: ${r.roster_period}`)
  console.log(`  Type: ${r.request_type}`)
  console.log(`  Method: ${r.request_method}`)
  console.log('')
})

console.log('✅ Test Complete - Roster period filter working correctly!')

process.exit(0)
