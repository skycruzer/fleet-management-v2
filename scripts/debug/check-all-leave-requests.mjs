import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('\n=== Checking ALL Leave Requests (No Filter) ===\n')

const { data, error, count } = await supabase.from('leave_requests').select('*', { count: 'exact' })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Total count: ${count}`)
console.log(`Data records: ${data?.length || 0}`)

if (data && data.length > 0) {
  console.log('\n=== Sample Leave Requests ===\n')
  data.forEach((req, idx) => {
    console.log(
      `${idx + 1}. Period: ${req.roster_period}, Type: ${req.request_type}, Status: ${req.status}`
    )
  })

  // Group by period and type
  const grouped = {}
  data.forEach((req) => {
    const period = req.roster_period
    if (!grouped[period]) {
      grouped[period] = { total: 0, byType: {}, pending: 0, approved: 0 }
    }
    grouped[period].total++
    if (req.status === 'PENDING') grouped[period].pending++
    if (req.status === 'APPROVED') grouped[period].approved++

    const type = req.request_type || 'UNKNOWN'
    grouped[period].byType[type] = (grouped[period].byType[type] || 0) + 1
  })

  console.log('\n=== Grouped by Period ===\n')
  Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([period, stats]) => {
      console.log(`${period}:`)
      console.log(`  Total: ${stats.total}, Pending: ${stats.pending}, Approved: ${stats.approved}`)
      console.log(`  Types: ${JSON.stringify(stats.byType)}`)
    })
} else {
  console.log('\n⚠️  NO DATA FOUND!')
  console.log('This could mean:')
  console.log('1. The table is truly empty')
  console.log('2. RLS policies are blocking access with anon key')
  console.log('3. You need to be authenticated to see the data')
}

process.exit(0)
