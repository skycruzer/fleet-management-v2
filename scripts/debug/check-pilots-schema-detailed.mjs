import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== Checking pilots table schema ===\n')

const { data, error } = await supabase
  .from('pilots')
  .select('*')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else if (data && data.length > 0) {
  console.log('Pilots table columns:')
  console.log(Object.keys(data[0]).join(', '))
  console.log('\nSample record:')
  console.log(JSON.stringify(data[0], null, 2))
} else {
  console.log('No records found')
}
