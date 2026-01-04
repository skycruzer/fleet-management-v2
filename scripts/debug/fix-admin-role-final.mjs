import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fixAdminRole() {
  const email = 'skycruzer@icloud.com'

  console.log('\n🔍 Fixing admin role for leave bid management...')
  console.log('='.repeat(60))

  // Get user by email from auth
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers()

  if (listError || !users) {
    console.error('❌ Error listing users:', listError?.message)
    return
  }

  const authUser = users.find((u) => u.email === email)

  if (!authUser) {
    console.log('❌ User not found in auth')
    return
  }

  console.log('✅ User ID:', authUser.id)

  // Check current role in an_users
  const { data: anUser, error: selectError } = await supabase
    .from('an_users')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single()

  if (selectError) {
    if (selectError.code === 'PGRST116') {
      // No record exists, create one
      console.log('📝 Creating an_users record...')
      const { error: insertError } = await supabase.from('an_users').insert({
        id: authUser.id,
        email: email,
        role: 'Admin',
      })

      if (insertError) {
        console.error('❌ Error creating record:', insertError.message)
        return
      }

      console.log('✅ an_users record created with Admin role')
    } else {
      console.error('❌ Error checking role:', selectError.message)
      return
    }
  } else {
    // Update existing record
    console.log('Current role:', anUser.role)

    if (anUser.role !== 'Admin') {
      console.log('🔄 Updating role to "Admin"...')
      const { error: updateError } = await supabase
        .from('an_users')
        .update({ role: 'Admin' })
        .eq('id', authUser.id)

      if (updateError) {
        console.error('❌ Error updating role:', updateError.message)
        return
      }

      console.log('✅ Role updated to "Admin"')
    } else {
      console.log('✅ Role is already "Admin"')
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Leave Bid Management Access Configured')
  console.log('\nYou can now:')
  console.log('  • Approve leave bids')
  console.log('  • Reject leave bids')
  console.log('  • View/Edit all bids')
  console.log('='.repeat(60))
}

fixAdminRole().catch(console.error)
