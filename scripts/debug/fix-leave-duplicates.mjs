/**
 * Remove duplicate leave requests from database
 * Strategy: Keep the oldest record (earliest created_at) for each unique combination
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file manually
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

async function fixDuplicates() {
  console.log('\n🔧 Fixing Leave Request Duplicates\n')

  // Fetch all leave requests
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('pilot_id', { ascending: true })
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching data:', error.message)
    return
  }

  console.log(`📊 Total records: ${data.length}`)

  // Group by unique combination (pilot + dates)
  const groups = {}
  data.forEach((record) => {
    const key = `${record.pilot_id}-${record.start_date}-${record.end_date}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(record)
  })

  // Find records to delete (all but the first/oldest in each group)
  const recordsToDelete = []
  const recordsToKeep = []

  Object.entries(groups).forEach(([key, records]) => {
    if (records.length > 1) {
      // Keep the oldest record (first in the sorted array)
      recordsToKeep.push(records[0])
      // Delete the rest
      records.slice(1).forEach((r) => recordsToDelete.push(r))
    } else {
      recordsToKeep.push(records[0])
    }
  })

  console.log(`\n📌 Records to keep: ${recordsToKeep.length}`)
  console.log(`🗑️  Records to delete: ${recordsToDelete.length}`)

  if (recordsToDelete.length === 0) {
    console.log('\n✅ No duplicates to remove!')
    return
  }

  console.log(`\n⚠️  About to delete ${recordsToDelete.length} duplicate records...`)
  console.log('Duplicate IDs:')
  recordsToDelete.forEach((r) => {
    console.log(`  - ${r.id} (${r.pilot_id.substring(0, 8)}... ${r.start_date} to ${r.end_date})`)
  })

  // Prompt for confirmation (in production)
  console.log('\n⏳ Deleting duplicates...')

  const deleteIds = recordsToDelete.map((r) => r.id)
  const { error: deleteError } = await supabase.from('leave_requests').delete().in('id', deleteIds)

  if (deleteError) {
    console.error('❌ Error deleting duplicates:', deleteError.message)
    return
  }

  console.log('✅ Successfully deleted duplicates!')

  // Verify final state
  const { data: finalData, error: finalError } = await supabase.from('leave_requests').select('id')

  if (!finalError) {
    console.log(`\n📊 Current total records: ${finalData.length}`)
    console.log(`📊 Expected after cleanup: ${recordsToKeep.length}`)
  }
}

fixDuplicates()
