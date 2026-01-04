import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function checkAdminCredentials() {
  const email = 'skycruzer@icloud.com'

  console.log('\n🔍 Checking admin credentials for:', email)
  console.log('='.repeat(60))

  // Check if user exists in Supabase Auth
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    return
  }

  const authUser = users.find((u) => u.email === email)

  if (!authUser) {
    console.log('❌ User not found in Supabase Auth')
    console.log('\n📋 Creating admin user...')

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Lemakot@1972',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Maurice Rondeau',
      },
    })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      return
    }

    console.log('✅ Admin user created:', newUser.user.id)

    // Create an_users record
    const { error: anUserError } = await supabase.from('an_users').insert({
      id: newUser.user.id,
      email: email,
      role: 'admin',
      full_name: 'Maurice Rondeau',
    })

    if (anUserError) {
      console.error('❌ Error creating an_users record:', anUserError.message)
    } else {
      console.log('✅ an_users record created')
    }
  } else {
    console.log('✅ User exists in Supabase Auth')
    console.log('User ID:', authUser.id)
    console.log('Email:', authUser.email)
    console.log('Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
    console.log('Created:', authUser.created_at)

    // Check an_users table
    const { data: anUser, error: anError } = await supabase
      .from('an_users')
      .select('*')
      .eq('email', email)
      .single()

    if (anError) {
      console.log('\n❌ User not found in an_users table')
      console.log('Creating an_users record...')

      const { error: insertError } = await supabase.from('an_users').insert({
        id: authUser.id,
        email: email,
        role: 'admin',
        full_name: 'Maurice Rondeau',
      })

      if (insertError) {
        console.error('❌ Error creating an_users record:', insertError.message)
      } else {
        console.log('✅ an_users record created')
      }
    } else {
      console.log('\n✅ an_users record exists')
      console.log('Role:', anUser.role)
      console.log('Full name:', anUser.full_name)
    }

    // Reset password
    console.log('\n🔄 Resetting password to: Lemakot@1972')
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: 'Lemakot@1972',
    })

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message)
    } else {
      console.log('✅ Password reset successfully')
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Admin credentials verified and ready')
  console.log('\nLogin with:')
  console.log('  Email: skycruzer@icloud.com')
  console.log('  Password: Lemakot@1972')
  console.log('='.repeat(60))
}

checkAdminCredentials().catch(console.error)
