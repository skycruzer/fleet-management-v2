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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
}

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('\n=== Using SERVICE ROLE to bypass RLS ===\n')

// Get all leave requests
const { data, error, count } = await supabase.from('leave_requests').select('*', { count: 'exact' })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Total leave requests (service role): ${count}`)

if (data && data.length > 0) {
  console.log('\n=== Sample leave requests ===')
  data.slice(0, 5).forEach((req) => {
    console.log(`Period: ${req.roster_period}, Type: ${req.request_type}, Status: ${req.status}`)
  })

  // Group by roster_period and type
  const summary = {}
  data.forEach((req) => {
    const key = `${req.roster_period}|${req.request_type || 'NO_TYPE'}`
    if (!summary[key]) {
      summary[key] = {
        roster_period: req.roster_period,
        request_type: req.request_type || 'NO_TYPE',
        count: 0,
        pending: 0,
        approved: 0,
      }
    }
    summary[key].count++
    if (req.status === 'PENDING') summary[key].pending++
    if (req.status === 'APPROVED') summary[key].approved++
  })

  console.log('\n=== LEAVE REQUESTS BY PERIOD AND TYPE ===\n')
  Object.values(summary)
    .sort((a, b) => {
      const periodCompare = a.roster_period.localeCompare(b.roster_period)
      return periodCompare !== 0 ? periodCompare : a.request_type.localeCompare(b.request_type)
    })
    .forEach((item) => {
      console.log(
        `${item.roster_period.padEnd(12)} | ${item.request_type.padEnd(25)} | Total: ${item.count}, Pending: ${item.pending}, Approved: ${item.approved}`
      )
    })
} else {
  console.log('Still no data! Table might be actually empty.')
}

process.exit(0)
