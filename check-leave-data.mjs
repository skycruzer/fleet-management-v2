import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Get all leave requests
console.log('\n=== Fetching ALL leave requests ===\n')
const { data, error, count } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact' })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Total leave requests: ${count}`)
console.log(`Data length: ${data?.length || 0}`)

if (data && data.length > 0) {
  console.log('\n=== First 10 leave requests ===')
  data.slice(0, 10).forEach(req => {
    console.log(`ID: ${req.id}`)
    console.log(`  Pilot: ${req.pilot_id}`)
    console.log(`  Period: ${req.roster_period}`)
    console.log(`  Type: ${req.request_type}`)
    console.log(`  Status: ${req.status}`)
    console.log(`  Dates: ${req.start_date} to ${req.end_date}`)
    console.log('')
  })

  // Group by roster_period
  const byPeriod = {}
  data.forEach(req => {
    if (!byPeriod[req.roster_period]) {
      byPeriod[req.roster_period] = {
        total: 0,
        types: new Set(),
        pending: 0,
        approved: 0,
        rejected: 0
      }
    }
    byPeriod[req.roster_period].total++
    byPeriod[req.roster_period].types.add(req.request_type)
    if (req.status === 'PENDING') byPeriod[req.roster_period].pending++
    if (req.status === 'APPROVED') byPeriod[req.roster_period].approved++
    if (req.status === 'REJECTED') byPeriod[req.roster_period].rejected++
  })

  console.log('\n=== SUMMARY BY ROSTER PERIOD ===\n')
  Object.entries(byPeriod)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([period, stats]) => {
      console.log(`${period}:`)
      console.log(`  Total: ${stats.total}`)
      console.log(`  Pending: ${stats.pending}, Approved: ${stats.approved}, Rejected: ${stats.rejected}`)
      console.log(`  Types: ${Array.from(stats.types).join(', ')}`)
      console.log('')
    })
} else {
  console.log('No data found!')
}

process.exit(0)
