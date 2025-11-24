/**
 * Delete All Flight Requests (RDO/SDO)
 *
 * Removes all FLIGHT category requests from the pilot_requests table
 *
 * Usage: node scripts/delete-flight-requests.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteFlightRequests() {
  console.log('🗑️  Deleting all FLIGHT requests from pilot_requests table...\n')

  try {
    // First, count how many FLIGHT requests exist
    const { count, error: countError } = await supabase
      .from('pilot_requests')
      .select('*', { count: 'exact', head: true })
      .eq('request_category', 'FLIGHT')

    if (countError) {
      console.error('❌ Error counting FLIGHT requests:', countError.message)
      process.exit(1)
    }

    console.log(`📊 Found ${count} FLIGHT request(s) to delete\n`)

    if (count === 0) {
      console.log('✅ No FLIGHT requests to delete. Database is already clean.')
      process.exit(0)
    }

    // Delete all FLIGHT requests
    const { data, error } = await supabase
      .from('pilot_requests')
      .delete()
      .eq('request_category', 'FLIGHT')
      .select()

    if (error) {
      console.error('❌ Error deleting FLIGHT requests:', error.message)
      process.exit(1)
    }

    console.log(`✅ Successfully deleted ${data.length} FLIGHT request(s)`)
    console.log('\n📋 Deleted request IDs:')
    data.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.id} - ${req.name} (${req.request_type}) - ${req.start_date} to ${req.end_date}`)
    })

    console.log('\n✨ Database cleaned successfully!')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

deleteFlightRequests()
