import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check all users
const { data, error } = await supabase
  .from('an_users')
  .select('id, email, role, created_at')
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching users:', error)
} else {
  console.log(`Found ${data.length} users:`)
  console.log(JSON.stringify(data, null, 2))
}
