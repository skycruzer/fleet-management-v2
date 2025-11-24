import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function updateAdminPassword() {
  const email = 'skycruzer@icloud.com'
  const newPassword = 'mron2393'
  
  console.log('\n🔄 Updating admin password...')
  console.log('Email:', email)
  console.log('=' .repeat(60))
  
  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    return
  }
  
  const authUser = users.find(u => u.email === email)
  
  if (!authUser) {
    console.log('❌ User not found')
    return
  }
  
  console.log('✅ Found user:', authUser.id)
  
  // Update password
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: newPassword }
  )
  
  if (updateError) {
    console.error('❌ Error updating password:', updateError.message)
    return
  }
  
  console.log('✅ Password updated successfully')
  console.log('\n' + '='.repeat(60))
  console.log('Admin credentials ready:')
  console.log('  Email: skycruzer@icloud.com')
  console.log('  Password: mron2393')
  console.log('='.repeat(60))
}

updateAdminPassword().catch(console.error)
