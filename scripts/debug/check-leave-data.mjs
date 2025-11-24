import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { count: leaveCount } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })

console.log(`leave_requests (deprecated) table has ${leaveCount} records\n`)

const { data, error } = await supabase
  .from('leave_requests')
  .select('*, pilot:pilots(*)')
  .limit(2)

if (error) {
  console.error('Error:', error)
} else if (data && data.length > 0) {
  console.log('Sample record:')
  console.log('Fields:', Object.keys(data[0]).filter(k => k !== 'pilot').join(', '))
  console.log('\nFirst record:')
  console.log(JSON.stringify(data[0], null, 2))
}
