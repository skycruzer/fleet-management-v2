import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Check admin users
const { data, error } = await supabase
  .from('an_users')
  .select('id, email, role, created_at')
  .limit(5)

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('\n📋 Registered Users:')
  console.log(JSON.stringify(data, null, 2))
  console.log(`\nTotal: ${data.length} users found`)
}
