/**
 * Check leave_requests table for SDO/RDO data
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLeaveRequests() {
  console.log('🔍 Checking leave_requests table...\n')

  // Get total count
  const { count: totalCount } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })

  console.log(`✅ Total records: ${totalCount}\n`)

  // Check for different leave types
  const types = ['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP']

  for (const type of types) {
    const { count, error } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .ilike('leave_type', type)

    if (!error && count > 0) {
      console.log(`   ${type}: ${count} records`)
    }
  }

  // Get sample records
  console.log('\n📋 Sample records:\n')
  const { data } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, leave_type, start_date, end_date, status, roster_period')
    .limit(5)

  if (data && data.length > 0) {
    data.forEach(record => {
      console.log(`   ${record.leave_type.padEnd(12)} | ${record.roster_period} | ${record.status.padEnd(10)} | ${record.start_date}`)
    })
  }
}

checkLeaveRequests().catch(console.error)
