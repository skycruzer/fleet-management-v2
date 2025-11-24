import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Check total count
const { count: totalCount } = await supabase
  .from('pilot_requests')
  .select('*', { count: 'exact', head: true })

console.log(`Total pilot_requests records: ${totalCount}`)

// Check leave requests count
const { count: leaveCount } = await supabase
  .from('pilot_requests')
  .select('*', { count: 'exact', head: true })
  .eq('request_category', 'LEAVE')

console.log(`Leave requests: ${leaveCount}`)

// Get one sample record
const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else if (data && data.length > 0) {
  console.log('\nSample record structure:')
  console.log('Fields:', Object.keys(data[0]).join(', '))
  console.log('\nSample data:')
  console.log(JSON.stringify(data[0], null, 2))
} else {
  console.log('\nNo records found in pilot_requests table')
}
