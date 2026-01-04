/**
 * Check original leave_requests table for all leave types
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

async function checkOriginalData() {
  console.log('🔍 Checking ORIGINAL leave_requests table...\n')

  const { data: leaveReqs, error } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, request_type, start_date, end_date, status, roster_period')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Total leave_requests: ${leaveReqs.length}\n`)

  // Group by request_type
  const byType = {}
  leaveReqs.forEach((req) => {
    const type = req.request_type || 'NULL'
    byType[type] = (byType[type] || 0) + 1
  })

  console.log('📊 Breakdown by Request Type:')
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })

  // Show all unique request types
  console.log('\n📝 All records:')
  leaveReqs.forEach((req, idx) => {
    const type = (req.request_type || 'NULL').padEnd(15)
    console.log(`   ${idx + 1}. ${type} | ${req.roster_period} | ${req.status}`)
  })

  // Check if there's a separate table for RDO/SDO
  console.log('\n\n🔍 Checking for other request tables...\n')

  const tables = [
    'flight_requests',
    'roster_requests',
    'schedule_requests',
    'rdo_requests',
    'sdo_requests',
  ]

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (!error) {
        console.log(`   ✅ ${table}: ${count} records`)
      } else if (error.code === '42P01') {
        console.log(`   ⚠️  ${table}: Table does not exist`)
      } else {
        console.log(`   ❌ ${table}: ${error.message}`)
      }
    } catch (e) {
      console.log(`   ⚠️  ${table}: ${e.message}`)
    }
  }
}

checkOriginalData().catch(console.error)
