import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('=== Checking leave_requests table ===')
  const { data: leaveData, error: leaveError } = await supabase
    .from('leave_requests')
    .select('id, pilot_id, start_date, status')
    .limit(5)

  if (leaveError) {
    console.error('Error fetching leave_requests:', leaveError.message)
  } else {
    const leaveCount = leaveData ? leaveData.length : 0
    console.log(`Found ${leaveCount} records in leave_requests`)
    if (leaveData && leaveData.length > 0) {
      console.log('Sample record fields:', Object.keys(leaveData[0]))
    }
  }

  console.log('\n=== Checking pilot_requests table ===')
  const { data: pilotData, error: pilotError } = await supabase
    .from('pilot_requests')
    .select('id, pilot_id, start_date, workflow_status, request_category')
    .eq('request_category', 'LEAVE')
    .limit(5)

  if (pilotError) {
    console.error('Error fetching pilot_requests:', pilotError.message)
  } else {
    const pilotCount = pilotData ? pilotData.length : 0
    console.log(`Found ${pilotCount} LEAVE records in pilot_requests`)
    if (pilotData && pilotData.length > 0) {
      console.log('Sample record fields:', Object.keys(pilotData[0]))
    }
  }
}

checkTables()
