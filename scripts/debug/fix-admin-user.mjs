import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixAdminUser() {
  console.log('🔍 Checking admin user: skycruzer@icloud.com')
  console.log('='.repeat(80))

  // 1. Check if user exists in Supabase Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError.message)
    return
  }

  const authUser = authUsers.users.find((u) => u.email === 'skycruzer@icloud.com')

  if (!authUser) {
    console.log('❌ User not found in Supabase Auth')
    console.log('Creating user...')

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
      email_confirm: true,
    })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      return
    }

    console.log('✅ User created in Supabase Auth:', newUser.user.id)
  } else {
    console.log('✅ User exists in Supabase Auth:', authUser.id)
  }

  const userId = authUser?.id || newUser?.user?.id

  // 2. Check if user exists in an_users table
  const { data: anUser, error: anError } = await supabase
    .from('an_users')
    .select('*')
    .eq('email', 'skycruzer@icloud.com')
    .maybeSingle()

  if (anError && anError.code !== 'PGRST116') {
    console.error('❌ Error checking an_users:', anError.message)
    return
  }

  if (!anUser) {
    console.log('❌ User not found in an_users table')
    console.log('Adding user to an_users...')

    const { data: newAnUser, error: insertError } = await supabase
      .from('an_users')
      .insert({
        id: userId,
        email: 'skycruzer@icloud.com',
        username: 'skycruzer',
        role: 'admin',
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting into an_users:', insertError.message)
      return
    }

    console.log('✅ User added to an_users table with admin role')
  } else {
    console.log('✅ User exists in an_users table')
    console.log('   ID:', anUser.id)
    console.log('   Email:', anUser.email)
    console.log('   Role:', anUser.role)
    console.log('   Status:', anUser.status)

    // Update role to admin if not already
    if (anUser.role !== 'admin') {
      console.log('⚠️  User role is not admin, updating...')

      const { error: updateError } = await supabase
        .from('an_users')
        .update({ role: 'admin' })
        .eq('id', anUser.id)

      if (updateError) {
        console.error('❌ Error updating role:', updateError.message)
        return
      }

      console.log('✅ User role updated to admin')
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ Admin user setup complete!')
  console.log('   You can now login with: skycruzer@icloud.com / mron2393')
}

fixAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
