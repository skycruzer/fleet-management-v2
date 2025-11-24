/**
 * Apply migration to backfill request_method for existing leave_requests
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔄 Applying migration to backfill request_method...\n')

// Execute the migration SQL
const { data, error } = await supabase.rpc('exec_sql', {
  sql: `
    UPDATE leave_requests
    SET request_method = CASE
      WHEN pilot_user_id IS NOT NULL THEN 'SYSTEM'
      ELSE 'EMAIL'
    END
    WHERE request_method IS NULL;
  `
})

if (error) {
  console.error('❌ Migration failed:', error.message)

  // Try alternative method - direct UPDATE via Supabase client
  console.log('\n🔄 Trying alternative method...\n')

  // First, get all records with NULL request_method
  const { data: nullRecords, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, pilot_user_id')
    .is('request_method', null)

  if (fetchError) {
    console.error('❌ Failed to fetch NULL records:', fetchError.message)
    process.exit(1)
  }

  console.log(`Found ${nullRecords.length} records with NULL request_method\n`)

  // Update each record
  let successCount = 0
  let failCount = 0

  for (const record of nullRecords) {
    const requestMethod = record.pilot_user_id ? 'SYSTEM' : 'EMAIL'

    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({ request_method: requestMethod })
      .eq('id', record.id)

    if (updateError) {
      console.error(`❌ Failed to update ${record.id}: ${updateError.message}`)
      failCount++
    } else {
      successCount++
    }
  }

  console.log(`\n✅ Successfully updated ${successCount} records`)
  if (failCount > 0) {
    console.log(`⚠️  Failed to update ${failCount} records`)
  }
} else {
  console.log('✅ Migration completed successfully')
  console.log('Data:', data)
}

// Verify the results
const { count: remainingNulls } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })
  .is('request_method', null)

console.log(`\n📊 Remaining NULL request_method records: ${remainingNulls}`)

// Show distribution
const { data: distribution } = await supabase
  .from('leave_requests')
  .select('request_method')

const counts = {}
distribution?.forEach(r => {
  const method = r.request_method || 'NULL'
  counts[method] = (counts[method] || 0) + 1
})

console.log('\n📈 Request method distribution:')
Object.entries(counts).forEach(([method, count]) => {
  console.log(`  ${method}: ${count}`)
})

process.exit(0)
