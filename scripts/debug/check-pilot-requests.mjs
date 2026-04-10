import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'LEAVE')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Sample pilot_request fields:')
  console.log(JSON.stringify(data[0], null, 2))
}
