/**
 * Test leave report now queries unified pilot_requests table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLeaveReport() {
  console.log('\n🔍 Testing Leave Report Query\n')

  // Simulate the report query (from pilot_requests)
  const { data, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data.length} leave requests in pilot_requests table\n`)

  // Group by pilot
  const byPilot = {}
  data.forEach((req) => {
    const pilotName = req.name || 'Unknown'
    if (!byPilot[pilotName]) {
      byPilot[pilotName] = []
    }
    byPilot[pilotName].push(req)
  })

  console.log('📊 Leave Requests by Pilot:\n')
  Object.entries(byPilot)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([name, requests]) => {
      console.log(`   ${name} (${requests[0].rank}): ${requests.length} request(s)`)
      requests.forEach((req) => {
        console.log(
          `     - ${req.request_type}: ${req.start_date} to ${req.end_date} [${req.workflow_status}]`
        )
      })
    })

  // Check for Craig Duffield
  const craigRequests = data.filter(
    (r) => r.name?.toUpperCase().includes('CRAIG') && r.name?.toUpperCase().includes('DUFFIELD')
  )
  console.log(`\n✅ Craig Duffield: Found ${craigRequests.length} leave request(s)`)

  if (craigRequests.length === 0) {
    console.log('   ⚠️  Still missing Craig Duffield!')
  }

  // Compare with old table
  const { data: oldData } = await supabase.from('leave_requests').select('*')

  console.log(`\n📊 Comparison:`)
  console.log(`   Old table (leave_requests): ${oldData?.length || 0} records`)
  console.log(`   New table (pilot_requests): ${data.length} leave records`)
  console.log(`   Difference: +${data.length - (oldData?.length || 0)} records`)
}

testLeaveReport()
