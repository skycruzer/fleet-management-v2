/**
 * Analyze duplicate leave requests in detail
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file manually
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

async function analyzeDuplicates() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      pilot:pilots!leave_requests_pilot_id_fkey(
        first_name,
        last_name,
        employee_id
      )
    `)
    .order('pilot_id', { ascending: true })
    .order('start_date', { ascending: true })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log('\n📊 Analyzing Leave Request Duplicates\n')

  // Group by pilot + dates to find duplicates
  const groups = {}
  data.forEach(record => {
    const key = `${record.pilot_id}-${record.start_date}-${record.end_date}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(record)
  })

  // Find duplicates
  const duplicateGroups = Object.entries(groups).filter(([_, records]) => records.length > 1)

  console.log(`Total leave requests: ${data.length}`)
  console.log(`Unique combinations: ${Object.keys(groups).length}`)
  console.log(`Duplicate groups: ${duplicateGroups.length}`)
  console.log(`\nDuplicate breakdown:`)

  duplicateGroups.forEach(([key, records]) => {
    const first = records[0]
    console.log(`\n🔍 ${first.pilot?.first_name} ${first.pilot?.last_name} (${first.pilot?.employee_id})`)
    console.log(`   Dates: ${first.start_date} to ${first.end_date}`)
    console.log(`   Duplicate count: ${records.length}`)
    console.log(`   IDs:`)
    records.forEach(r => {
      console.log(`     - ${r.id} (created: ${r.created_at}, updated: ${r.updated_at})`)
      console.log(`       Status: ${r.status}, Type: ${r.request_type}, Submission: ${r.submission_type}`)
    })
  })

  // Check if duplicates have different IDs
  const allUniqueIds = new Set(data.map(r => r.id))
  console.log(`\n📌 All IDs are unique: ${allUniqueIds.size === data.length ? '✅ YES' : '❌ NO'}`)

  // Check created_at timestamps
  console.log(`\n⏰ Created timestamps analysis:`)
  const timestampGroups = {}
  data.forEach(r => {
    const ts = r.created_at
    timestampGroups[ts] = (timestampGroups[ts] || 0) + 1
  })
  const sameTimestamps = Object.entries(timestampGroups).filter(([_, count]) => count > 1)
  if (sameTimestamps.length > 0) {
    console.log(`   Found ${sameTimestamps.length} timestamps with multiple records:`)
    sameTimestamps.forEach(([ts, count]) => {
      console.log(`   - ${ts}: ${count} records`)
    })
  }
}

analyzeDuplicates()
