import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Check flight_requests table
const { data, error } = await supabase
  .from('flight_requests')
  .select('*, pilot:pilots!flight_requests_pilot_id_fkey(first_name, last_name, role, employee_id)')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Sample flight_request:')
  console.log(JSON.stringify(data[0], null, 2))
}
