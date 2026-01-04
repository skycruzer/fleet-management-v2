import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Proper join using hint
const { data, error } = await supabase
  .from('leave_requests')
  .select(
    '*, pilot:pilots!leave_requests_pilot_id_fkey(first_name, last_name, rank, employee_number)'
  )
  .limit(1)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Sample leave_request with pilot:')
  console.log(JSON.stringify(data[0], null, 2))
}
