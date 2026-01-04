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

// Get distinct leave request types and roster periods
const { data, error } = await supabase
  .from('leave_requests')
  .select('roster_period, request_type, status')
  .order('roster_period')
  .order('request_type')

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

// Group by roster_period and request_type
const grouped = {}
data.forEach((row) => {
  const key = `${row.roster_period}|${row.request_type}`
  if (!grouped[key]) {
    grouped[key] = {
      roster_period: row.roster_period,
      request_type: row.request_type,
      pending: 0,
      approved: 0,
      total: 0,
    }
  }
  grouped[key].total++
  if (row.status === 'PENDING') grouped[key].pending++
  if (row.status === 'APPROVED') grouped[key].approved++
})

console.log('\n=== LEAVE REQUESTS BY TYPE AND PERIOD ===\n')
Object.values(grouped).forEach((item) => {
  console.log(
    `${item.roster_period.padEnd(12)} | ${item.request_type.padEnd(20)} | Total: ${item.total}, Pending: ${item.pending}, Approved: ${item.approved}`
  )
})

console.log('\n=== SUMMARY BY PERIOD ===\n')
const periodSummary = {}
data.forEach((row) => {
  if (!periodSummary[row.roster_period]) {
    periodSummary[row.roster_period] = {
      total: 0,
      pending: 0,
      approved: 0,
      types: new Set(),
    }
  }
  periodSummary[row.roster_period].total++
  periodSummary[row.roster_period].types.add(row.request_type)
  if (row.status === 'PENDING') periodSummary[row.roster_period].pending++
  if (row.status === 'APPROVED') periodSummary[row.roster_period].approved++
})

Object.entries(periodSummary)
  .sort()
  .forEach(([period, stats]) => {
    console.log(
      `${period.padEnd(12)} | Total: ${stats.total}, Pending: ${stats.pending}, Approved: ${stats.approved}`
    )
    console.log(`              | Types: ${Array.from(stats.types).join(', ')}`)
  })

process.exit(0)
