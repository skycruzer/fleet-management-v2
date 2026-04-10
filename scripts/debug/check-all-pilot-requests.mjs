import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllData() {
  console.log('=== Checking pilot_requests table (ALL categories) ===')
  const { data: allData, error: allError } = await supabase
    .from('pilot_requests')
    .select('id, pilot_id, start_date, workflow_status, request_category')
    .limit(10)

  if (allError) {
    console.error('Error fetching pilot_requests:', allError.message)
  } else {
    console.log(`Found ${allData?.length || 0} total records in pilot_requests`)
    if (allData && allData.length > 0) {
      console.log('Sample records:', allData)
      console.log('\nCategory breakdown:')
      const categories = {}
      allData.forEach((record) => {
        categories[record.request_category] = (categories[record.request_category] || 0) + 1
      })
      console.log(categories)
    }
  }

  console.log('\n=== Checking leave_requests table ===')
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, start_date, status')
    .limit(10)

  if (leaveError) {
    console.error('Error fetching leave_requests:', leaveError.message)
  } else {
    console.log(`Found ${leaveData?.length || 0} records in leave_requests`)
    if (leaveData && leaveData.length > 0) {
      console.log('Sample records:', leaveData)
    }
  }

  console.log('\n=== Checking flight_requests table ===')
  const { data: flightData, error: flightError } = await supabase
    .from('flight_requests')
    .select('id, pilot_id, start_date, status')
    .limit(10)

  if (flightError) {
    console.error('Error fetching flight_requests:', flightError.message)
  } else {
    console.log(`Found ${flightData?.length || 0} records in flight_requests`)
    if (flightData && flightData.length > 0) {
      console.log('Sample records:', flightData)
    }
  }
}

checkAllData()
