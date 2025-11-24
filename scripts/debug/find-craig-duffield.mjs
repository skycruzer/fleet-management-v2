/**
 * Find Craig Duffield's records
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function findCraigDuffield() {
  console.log('\n🔍 Searching for Craig Duffield\n')

  // Find pilot
  const { data: pilots, error: pilotError } = await supabase
    .from('pilots')
    .select('*')
    .ilike('first_name', '%craig%')
    .ilike('last_name', '%duffield%')

  if (pilotError) {
    console.error('Error searching pilots:', pilotError.message)
  }

  if (!pilots || pilots.length === 0) {
    console.log('❌ Craig Duffield not found in pilots table')

    // Try broader search
    const { data: allPilots } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, employee_id')
      .or('first_name.ilike.%craig%,last_name.ilike.%duff%')

    console.log('\nSimilar pilots found:')
    allPilots?.forEach(p => {
      console.log(`  - ${p.first_name} ${p.last_name} (${p.employee_id})`)
    })

    return
  }

  console.log(`✅ Found Craig Duffield:`)
  pilots.forEach(pilot => {
    console.log(`   ID: ${pilot.id}`)
    console.log(`   Name: ${pilot.first_name} ${pilot.last_name}`)
    console.log(`   Employee: ${pilot.employee_id}`)
    console.log(`   Role: ${pilot.role}`)
  })

  const pilotId = pilots[0].id

  // Check leave requests
  console.log('\n📋 Leave Requests:')
  const { data: leaveRequests, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('start_date', { ascending: false })

  if (leaveError) {
    console.error('Error:', leaveError.message)
  } else if (!leaveRequests || leaveRequests.length === 0) {
    console.log('   ❌ No leave requests found')
  } else {
    console.log(`   ✅ Found ${leaveRequests.length} leave request(s):`)
    leaveRequests.forEach(req => {
      console.log(`   - ${req.request_type}: ${req.start_date} to ${req.end_date} (Status: ${req.status})`)
    })
  }

  // Check pilot_requests (unified table)
  console.log('\n📋 Pilot Requests (Unified Table):')
  const { data: pilotRequests, error: reqError } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('start_date', { ascending: false })

  if (reqError) {
    console.error('Error:', reqError.message)
  } else if (!pilotRequests || pilotRequests.length === 0) {
    console.log('   ❌ No requests found in pilot_requests table')
  } else {
    console.log(`   ✅ Found ${pilotRequests.length} request(s):`)
    pilotRequests.forEach(req => {
      console.log(`   - ${req.request_category}/${req.request_type}: ${req.start_date} to ${req.end_date || req.flight_date} (Status: ${req.workflow_status})`)
    })
  }

  // Check all leave requests to see pattern
  console.log('\n📊 Total Leave Requests in Database:')
  const { data: allLeave } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, start_date, end_date, created_at')
    .order('created_at', { ascending: true })

  console.log(`   Total: ${allLeave?.length || 0} records`)

  // Group by created_at timestamp to see seeding pattern
  const byTimestamp = {}
  allLeave?.forEach(req => {
    const ts = req.created_at.substring(0, 19) // Remove milliseconds
    byTimestamp[ts] = (byTimestamp[ts] || 0) + 1
  })

  console.log('\n   Records by creation timestamp:')
  Object.entries(byTimestamp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ts, count]) => {
      console.log(`   - ${ts}: ${count} records`)
    })
}

findCraigDuffield()
