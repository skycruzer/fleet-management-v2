import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check the admin user role
const { data, error } = await supabase
  .from('an_users')
  .select('id, email, role')
  .eq('email', 'skycruzer@icloud.com')
  .single()

if (error) {
  console.error('Error fetching user:', error)
} else {
  console.log('User data:')
  console.log(JSON.stringify(data, null, 2))
  console.log('\nRole value:', `"${data.role}"`)
  console.log('Role type:', typeof data.role)
  console.log('Is Admin?', data.role === 'Admin')
  console.log('Is Manager?', data.role === 'Manager')
}
