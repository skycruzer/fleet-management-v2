import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Check leave_requests table
console.log('=== LEAVE_REQUESTS TABLE ===')
const { data: leaveData, error: leaveError } = await supabase
  .from('leave_requests')
  .select('*, pilots(*)')
  .limit(1)

if (leaveError) {
  console.error('Error:', leaveError)
} else {
  console.log('Sample leave_request with pilot join:')
  console.log(JSON.stringify(leaveData[0], null, 2))
}
