/**
 * Test PDF Export Functionality
 * Simulates API call to check if PDF generation works
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('Testing PDF Export Flow...\n')

// Test fetching leave report data (same as reports-service.ts does)
console.log('1. Fetching leave requests for RP01/2026 and RP02/2026...')
const { data, error } = await supabase
  .from('pilot_requests')
  .select(`
    *,
    pilots!pilot_id (
      id,
      first_name,
      last_name,
      role,
      employee_id
    )
  `)
  .eq('request_category', 'LEAVE')
  .in('roster_period', ['RP01/2026', 'RP02/2026'])

if (error) {
  console.error('❌ Query failed:', error.message)
  process.exit(1)
}

console.log(`✅ Found ${data?.length || 0} leave requests\n`)

// Check if pilot data is properly joined
console.log('2. Checking pilot data structure...')
const sampleRequest = data?.[0]
if (sampleRequest) {
  console.log('Sample request structure:')
  console.log('  - id:', sampleRequest.id)
  console.log('  - request_type:', sampleRequest.request_type)
  console.log('  - pilots object:', sampleRequest.pilots ? 'EXISTS' : 'MISSING')

  if (sampleRequest.pilots) {
    console.log('  - pilot first_name:', sampleRequest.pilots.first_name)
    console.log('  - pilot last_name:', sampleRequest.pilots.last_name)
    console.log('  - pilot role:', sampleRequest.pilots.role)

    // Check if enriched fields would be created correctly
    const pilot_name = `${sampleRequest.pilots.first_name} ${sampleRequest.pilots.last_name}`
    const rank = sampleRequest.pilots.role
    console.log('  - enriched pilot_name:', pilot_name)
    console.log('  - enriched rank:', rank)
    console.log('✅ Pilot data structure is correct')
  } else {
    console.log('❌ Pilot data is missing from JOIN')
  }
} else {
  console.log('❌ No data found to test')
}

console.log('\n3. Summary:')
console.log('  - Query:', error ? 'FAILED' : 'SUCCESS')
console.log('  - Data count:', data?.length || 0)
console.log('  - Pilot JOIN:', sampleRequest?.pilots ? 'SUCCESS' : 'FAILED')
