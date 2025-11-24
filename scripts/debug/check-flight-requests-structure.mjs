/**
 * Check flight_requests table structure and data
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

async function checkFlightRequests() {
  console.log('🔍 Checking flight_requests table...\n')

  const { data, error, count } = await supabase
    .from('flight_requests')
    .select('*', { count: 'exact' })
    .limit(3)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Total records in table: ${count}`)
  console.log(`📋 Showing ${data.length} sample records\n`)

  if (data && data.length > 0) {
    console.log('Sample record structure:')
    console.log(JSON.stringify(data[0], null, 2))
  }
}

checkFlightRequests().catch(console.error)
