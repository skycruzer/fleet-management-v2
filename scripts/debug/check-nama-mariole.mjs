import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n=== CHECKING NAMA MARIOLE DATA ===\n')

// Find pilot Nama Mariole
console.log('🔍 Step 1: Finding Nama Mariole in pilots table...\n')
const { data: pilot, error: pilotError } = await supabase
  .from('pilots')
  .select('*')
  .ilike('first_name', '%nama%')
  .or('last_name.ilike.%mariole%')

if (pilotError) {
  console.error('❌ Error:', pilotError.message)
} else if (!pilot || pilot.length === 0) {
  console.log('⚠️  No pilot found matching "Nama Mariole"')
  console.log('\nSearching all pilots with similar names...\n')

  const { data: allPilots } = await supabase
    .from('pilots')
    .select('id, employee_id, first_name, last_name, role')
    .order('first_name')

  allPilots.forEach(p => {
    console.log(`   ${p.first_name} ${p.last_name} - ${p.role} (ID: ${p.id})`)
  })
} else {
  console.log(`✅ Found pilot: ${pilot[0].first_name} ${pilot[0].last_name}`)
  console.log(`   ID: ${pilot[0].id}`)
  console.log(`   Employee ID: ${pilot[0].employee_id}`)
  console.log(`   Role: ${pilot[0].role}\n`)

  const pilotId = pilot[0].id

  // Check pilot_requests table for this pilot
  console.log('🔍 Step 2: Checking pilot_requests table...\n')
  const { data: requests, error: reqError } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('created_at', { ascending: false })

  if (reqError) {
    console.error('❌ Error:', reqError.message)
  } else {
    console.log(`   Found ${requests.length} requests in pilot_requests table\n`)

    const flightRequests = requests.filter(r => r.request_category === 'FLIGHT')
    const leaveRequests = requests.filter(r => r.request_category === 'LEAVE')
    const rdoRequests = flightRequests.filter(r => r.request_type === 'RDO')
    const sdoRequests = flightRequests.filter(r => r.request_type === 'SDO')

    console.log(`   LEAVE requests: ${leaveRequests.length}`)
    console.log(`   FLIGHT requests: ${flightRequests.length}`)
    console.log(`     - RDO: ${rdoRequests.length}`)
    console.log(`     - SDO: ${sdoRequests.length}\n`)

    if (flightRequests.length > 0) {
      console.log('📋 Flight requests:\n')
      flightRequests.forEach((req, idx) => {
        console.log(`   ${idx + 1}. Type: ${req.request_type}`)
        console.log(`      Date: ${req.flight_date || req.start_date}`)
        console.log(`      Status: ${req.workflow_status}`)
        console.log(`      Reason: ${req.reason || 'N/A'}`)
        console.log(`      Created: ${req.created_at}\n`)
      })
    }
  }

  // Check old flight_requests table
  console.log('🔍 Step 3: Checking old flight_requests table...\n')
  const { data: oldFlightReqs, error: oldFlightError } = await supabase
    .from('flight_requests')
    .select('*')
    .eq('pilot_id', pilotId)
    .order('created_at', { ascending: false })

  if (oldFlightError) {
    console.error('❌ Error:', oldFlightError.message)
  } else {
    console.log(`   Found ${oldFlightReqs.length} requests in old flight_requests table\n`)

    if (oldFlightReqs.length > 0) {
      const oldRdo = oldFlightReqs.filter(r => r.request_type === 'RDO')
      const oldSdo = oldFlightReqs.filter(r => r.request_type === 'SDO')

      console.log(`     - RDO: ${oldRdo.length}`)
      console.log(`     - SDO: ${oldSdo.length}\n`)

      console.log('📋 Old flight requests:\n')
      oldFlightReqs.forEach((req, idx) => {
        console.log(`   ${idx + 1}. Type: ${req.request_type}`)
        console.log(`      Date: ${req.flight_date}`)
        console.log(`      Status: ${req.status}`)
        console.log(`      Description: ${req.description || 'N/A'}`)
        console.log(`      Created: ${req.created_at}\n`)
      })
    }
  }
}

console.log('\n=== SEARCH COMPLETE ===\n')
