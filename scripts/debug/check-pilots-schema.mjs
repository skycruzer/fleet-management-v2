import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Get one pilot to see available fields
const { data, error } = await supabase
  .from('pilots')
  .select('*')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Pilot table fields:')
  console.log(Object.keys(data[0]))
}
