import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// List all auth users
const { data: { users }, error } = await supabase.auth.admin.listUsers()

if (error) {
  console.error('Error fetching auth users:', error)
} else {
  console.log(`Found ${users.length} auth users:`)
  users.forEach(user => {
    console.log(`\nEmail: ${user.email}`)
    console.log(`ID: ${user.id}`)
    console.log(`Created: ${user.created_at}`)
    console.log(`Metadata:`, user.user_metadata)
  })
}
