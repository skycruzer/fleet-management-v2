import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugQuery() {
  console.log('Testing reports query...\n')

  // Test 1: Get all pilot_requests
  const { data: allData, error: allError } = await supabase
    .from('pilot_requests')
    .select('*')
    .limit(5)
  
  console.log('All pilot_requests (first 5):')
  console.log('Count:', allData?.length || 0)
  console.log('Error:', allError?.message || 'None')
  if (allData?.[0]) {
    console.log('Sample record fields:', Object.keys(allData[0]))
    console.log('Sample workflow_status:', allData[0].workflow_status)
    console.log('Sample rank:', allData[0].rank)
  }
  console.log('')

  // Test 2: Get LEAVE requests
  const { data: leaveData, error: leaveError } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
  
  console.log('LEAVE requests:')
  console.log('Count:', leaveData?.length || 0)
  console.log('Error:', leaveError?.message || 'None')
  if (leaveData?.[0]) {
    console.log('Sample LEAVE status:', leaveData[0].workflow_status)
  }
  console.log('')

  // Test 3: Check status filter with lowercase
  const { data: pendingLower, error: pendingLowerErr } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .in('workflow_status', ['pending'])
  
  console.log('LEAVE with status="pending" (lowercase):')
  console.log('Count:', pendingLower?.length || 0)
  console.log('Error:', pendingLowerErr?.message || 'None')
  console.log('')

  // Test 4: Check status filter with uppercase
  const { data: pendingUpper, error: pendingUpperErr } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .in('workflow_status', ['PENDING'])
  
  console.log('LEAVE with status="PENDING" (uppercase):')
  console.log('Count:', pendingUpper?.length || 0)
  console.log('Error:', pendingUpperErr?.message || 'None')
  console.log('')

  // Test 5: Get all unique workflow_status values
  const { data: statusData } = await supabase
    .from('pilot_requests')
    .select('workflow_status')
  
  const uniqueStatuses = [...new Set(statusData?.map(r => r.workflow_status))]
  console.log('All unique workflow_status values in database:')
  console.log(uniqueStatuses)
}

debugQuery()
