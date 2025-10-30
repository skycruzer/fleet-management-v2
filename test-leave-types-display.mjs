/**
 * Test script to verify leave request types are being fetched correctly
 */
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

// Test the exact function logic used in compact-roster-display.tsx
async function getLeaveRequestCounts(rosterPeriod) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('status, request_type')
    .eq('roster_period', rosterPeriod)

  if (error) {
    console.error(`Error fetching leave requests for ${rosterPeriod}:`, error)
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  if (!data || data.length === 0) {
    console.log(`No leave requests found for ${rosterPeriod}`)
    return { pending: 0, approved: 0, total: 0, byType: {} }
  }

  const pending = data.filter((r) => r.status === 'PENDING').length
  const approved = data.filter((r) => r.status === 'APPROVED').length

  // Count by request type
  const byType = {}
  data.forEach((r) => {
    const type = r.request_type || 'UNKNOWN'
    byType[type] = (byType[type] || 0) + 1
  })

  console.log(`Leave requests for ${rosterPeriod}:`, { total: data.length, pending, approved, byType })
  return { pending, approved, total: data.length, byType }
}

// Test with the periods the user mentioned
console.log('\n=== Testing Leave Request Types Display ===\n')
console.log('Testing the periods user mentioned: RP13/2025, RP01/2026, RP02/2026\n')

const testPeriods = ['RP13/2025', 'RP01/2026', 'RP02/2026', 'RP11/2025', 'RP12/2025']

for (const period of testPeriods) {
  await getLeaveRequestCounts(period)
}

console.log('\n=== Test Complete ===\n')
process.exit(0)
