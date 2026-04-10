import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fixAdminRole() {
  const email = 'skycruzer@icloud.com'

  console.log('\n🔍 Fixing admin role...')

  // Get user
  const { data: users } = await supabase.auth.admin.listUsers()
  const authUser = users.find((u) => u.email === email)

  if (!authUser) {
    console.log('❌ User not found')
    return
  }

  console.log('✅ User ID:', authUser.id)

  // Check current role
  const { data: anUser } = await supabase
    .from('an_users')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single()

  if (anUser) {
    console.log('Current role:', anUser.role)

    // Update to Admin (capitalized)
    const { error } = await supabase
      .from('an_users')
      .update({ role: 'Admin' })
      .eq('id', authUser.id)

    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log('✅ Role updated to "Admin"')
    }
  } else {
    // Create an_users record
    console.log('Creating an_users record...')
    const { error } = await supabase.from('an_users').insert({
      id: authUser.id,
      email: email,
      role: 'Admin',
    })

    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log('✅ an_users record created with Admin role')
    }
  }

  console.log('\n✅ Admin role fixed - Leave bid buttons should work now')
}

fixAdminRole().catch(console.error)
