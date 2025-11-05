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

async function fixLeaveBidButtons() {
  const email = 'skycruzer@icloud.com'
  
  console.log('\n🔍 Checking admin role for leave bid management...')
  console.log('=' .repeat(60))
  
  // Check current role
  const { data: anUser, error } = await supabase
    .from('an_users')
    .select('id, email, role, full_name')
    .eq('email', email)
    .single()
  
  if (error || !anUser) {
    console.error('❌ User not found:', error?.message)
    return
  }
  
  console.log('Current role:', anUser.role)
  
  // API expects 'Admin' or 'Manager' (capitalized)
  if (anUser.role !== 'Admin' && anUser.role !== 'Manager') {
    console.log('\n🔄 Updating role to "Admin" (capitalized)...')
    
    const { error: updateError } = await supabase
      .from('an_users')
      .update({ role: 'Admin', full_name: 'Maurice Rondeau' })
      .eq('id', anUser.id)
    
    if (updateError) {
      console.error('❌ Error updating role:', updateError.message)
      return
    }
    
    console.log('✅ Role updated to "Admin"')
  } else {
    console.log('✅ Role is already correct')
  }
  
  // Update full_name if it's null
  if (!anUser.full_name) {
    console.log('\n🔄 Setting full_name...')
    const { error: nameError } = await supabase
      .from('an_users')
      .update({ full_name: 'Maurice Rondeau' })
      .eq('id', anUser.id)
    
    if (!nameError) {
      console.log('✅ Full name set')
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Admin configuration complete')
  console.log('\nYou should now be able to:')
  console.log('  - Approve/Reject leave bids')
  console.log('  - Access all admin features')
  console.log('='.repeat(60))
}

fixLeaveBidButtons().catch(console.error)
