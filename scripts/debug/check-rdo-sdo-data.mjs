import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
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

async function checkRDOSDOData() {
  console.log('🔍 Searching for RDO/SDO data in database...\n')

  // Check leave_requests table
  console.log('1. Checking leave_requests table...')
  const { data: leaveRequests, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*')
    .or('request_type.eq.RDO,request_type.eq.SDO')
    
  if (!leaveError && leaveRequests) {
    console.log(`   ✅ Found ${leaveRequests.length} RDO/SDO requests in leave_requests`)
    if (leaveRequests.length > 0) {
      console.log('   Sample:', JSON.stringify(leaveRequests[0], null, 2))
    }
  } else {
    console.log('   ❌ Error or no data:', leaveError?.message || 'No matches')
  }

  // Check pilot_requests table
  console.log('\n2. Checking pilot_requests table...')
  const { data: pilotRequests, error: pilotError } = await supabase
    .from('pilot_requests')
    .select('*')
    .or('request_type.eq.RDO,request_type.eq.SDO')
    
  if (!pilotError && pilotRequests) {
    console.log(`   ✅ Found ${pilotRequests.length} RDO/SDO requests in pilot_requests`)
    if (pilotRequests.length > 0) {
      console.log('   Sample:', JSON.stringify(pilotRequests[0], null, 2))
    }
  } else {
    console.log('   ❌ Error or no data:', pilotError?.message || 'No matches')
  }

  // Check flight_requests table
  console.log('\n3. Checking flight_requests table...')
  const { data: flightRequests, error: flightError } = await supabase
    .from('flight_requests')
    .select('*')
    .or('request_type.eq.RDO,request_type.eq.SDO')
    
  if (!flightError && flightRequests) {
    console.log(`   ✅ Found ${flightRequests.length} RDO/SDO requests in flight_requests`)
    if (flightRequests.length > 0) {
      console.log('   Sample:', JSON.stringify(flightRequests[0], null, 2))
    }
  } else {
    console.log('   ❌ Error or no data:', flightError?.message || 'No matches')
  }

  // Get all request types from leave_requests
  console.log('\n4. All request types in leave_requests:')
  const { data: allLeaveTypes } = await supabase
    .from('leave_requests')
    .select('request_type')
    
  if (allLeaveTypes) {
    const uniqueTypes = [...new Set(allLeaveTypes.map(r => r.request_type))]
    console.log('   Types:', uniqueTypes.join(', '))
    console.log('   Total rows:', allLeaveTypes.length)
  }

  // Get all request types from flight_requests
  console.log('\n5. All request types in flight_requests:')
  const { data: allFlightTypes } = await supabase
    .from('flight_requests')
    .select('request_type')
    
  if (allFlightTypes) {
    const uniqueTypes = [...new Set(allFlightTypes.map(r => r.request_type))]
    console.log('   Types:', uniqueTypes.join(', '))
    console.log('   Total rows:', allFlightTypes.length)
  }

  console.log('\n✅ Search complete!')
}

checkRDOSDOData().catch(console.error)
