import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'LEAVE')
  .gte('start_date', '2025-12-24')
  .order('created_at', { ascending: false })
  .limit(1)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Most recent leave request starting Dec 24, 2025:')
  console.log(JSON.stringify(data[0], null, 2))
}
