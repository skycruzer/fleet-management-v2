/**
 * Verify migrated data in pilot_requests table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function verifyData() {
  console.log('🔍 Verifying migrated data...\n')

  // Get all pilot_requests
  const { data: allRequests, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Total requests: ${allRequests.length}\n`)

  // Group by request type
  const byType = {}
  allRequests.forEach((req) => {
    byType[req.request_type] = (byType[req.request_type] || 0) + 1
  })

  console.log('📊 Breakdown by Request Type:')
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })

  // Group by roster period
  console.log('\n📅 Breakdown by Roster Period:')
  const byPeriod = {}
  allRequests.forEach((req) => {
    byPeriod[req.roster_period] = (byPeriod[req.roster_period] || 0) + 1
  })
  Object.entries(byPeriod)
    .sort()
    .forEach(([period, count]) => {
      console.log(`   ${period}: ${count}`)
    })

  // Group by status
  console.log('\n📋 Breakdown by Status:')
  const byStatus = {}
  allRequests.forEach((req) => {
    byStatus[req.workflow_status] = (byStatus[req.workflow_status] || 0) + 1
  })
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`)
  })

  // Show sample records
  console.log('\n📝 Sample records:')
  allRequests.slice(0, 3).forEach((req) => {
    console.log(`\n   Name: ${req.name}`)
    console.log(`   Type: ${req.request_type}`)
    console.log(`   Dates: ${req.start_date} to ${req.end_date}`)
    console.log(`   Period: ${req.roster_period}`)
    console.log(`   Status: ${req.workflow_status}`)
  })

  // Check original leave_requests for comparison
  console.log('\n\n🔍 Checking original leave_requests table...\n')
  const { data: leaveReqs } = await supabase.from('leave_requests').select('leave_type')

  if (leaveReqs) {
    const leaveTypes = {}
    leaveReqs.forEach((req) => {
      leaveTypes[req.leave_type] = (leaveTypes[req.leave_type] || 0) + 1
    })
    console.log('📊 Original leave_requests breakdown:')
    Object.entries(leaveTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
  }
}

verifyData().catch(console.error)
