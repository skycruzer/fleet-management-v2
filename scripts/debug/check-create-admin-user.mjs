#!/usr/bin/env node
/**
 * Check and Create Admin User in an_users Table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

process.env = { ...process.env, ...envVars }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking admin user in an_users table\n')

async function checkAndCreateAdmin() {
  try {
    // Step 1: Get Supabase Auth user
    console.log('Step 1: Looking up Supabase Auth user...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    const adminAuthUser = authUsers.users.find((u) => u.email === 'skycruzer@icloud.com')

    if (!adminAuthUser) {
      console.log('❌ No Supabase Auth user found for skycruzer@icloud.com')
      console.log('\nAvailable auth users:')
      authUsers.users.forEach((u) => console.log(`  - ${u.email} (id: ${u.id})`))
      return
    }

    console.log('✅ Found Supabase Auth user:')
    console.log(`   ID: ${adminAuthUser.id}`)
    console.log(`   Email: ${adminAuthUser.email}`)
    console.log(`   Created: ${adminAuthUser.created_at}`)

    // Step 2: Check if exists in an_users
    console.log('\nStep 2: Checking an_users table...')
    const { data: existingUser, error: queryError } = await supabase
      .from('an_users')
      .select('*')
      .eq('id', adminAuthUser.id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('❌ Error querying an_users:', queryError)
      return
    }

    if (existingUser) {
      console.log('✅ User exists in an_users table:')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Role: ${existingUser.role}`)
      console.log(`   Name: ${existingUser.first_name} ${existingUser.last_name}`)
      console.log('\n✅ Admin user is properly configured!')
      return
    }

    console.log('❌ User NOT found in an_users table')

    // Step 3: Create admin user record
    console.log('\nStep 3: Creating admin user in an_users table...')
    const { data: newUser, error: insertError } = await supabase
      .from('an_users')
      .insert({
        id: adminAuthUser.id,
        email: adminAuthUser.email,
        first_name: 'Maurice',
        last_name: 'Rondeau',
        role: 'admin',
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating admin user:', insertError)
      return
    }

    console.log('✅ Successfully created admin user in an_users:')
    console.log(`   ID: ${newUser.id}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Role: ${newUser.role}`)
    console.log('\n✨ Admin user is now ready to use!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

await checkAndCreateAdmin()
