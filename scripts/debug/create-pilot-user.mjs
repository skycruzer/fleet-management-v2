#!/usr/bin/env node
/**
 * Create pilot user in an_users table
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, serviceRoleKey)

console.log('🔧 Creating pilot user in an_users table\n')

// Create the pilot user with hashed password
const { data, error } = await serviceClient.rpc('create_pilot_user', {
  p_email: 'mrondeau@airniugini.com.pg',
  p_password: 'Lemakot@1972',
  p_employee_number: '001',
})

if (error) {
  console.log('⚠️  RPC function not found, using direct SQL insert\n')

  // Fallback: Use raw SQL
  const { data: insertData, error: insertError } = await serviceClient
    .from('an_users')
    .insert({
      email: 'mrondeau@airniugini.com.pg',
      employee_number: '001',
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()

  if (insertError) {
    console.log('❌ Failed to create user:', insertError.message)
    console.log('\n💡 You need to run this SQL directly in Supabase SQL Editor:')
    console.log(`
INSERT INTO an_users (email, password_hash, employee_number, status)
VALUES ('mrondeau@airniugini.com.pg', crypt('Lemakot@1972', gen_salt('bf')), '001', 'active');
    `)
    process.exit(1)
  } else {
    console.log('⚠️  User created but password_hash needs to be set via SQL')
    console.log('💡 Run this SQL in Supabase SQL Editor:')
    console.log(`
UPDATE an_users
SET password_hash = crypt('Lemakot@1972', gen_salt('bf'))
WHERE email = 'mrondeau@airniugini.com.pg';
    `)
  }
} else {
  console.log('✅ Pilot user created successfully!')
}

// Verify the user was created
const { data: user, error: checkError } = await serviceClient
  .from('an_users')
  .select('*')
  .eq('email', 'mrondeau@airniugini.com.pg')
  .single()

if (checkError) {
  console.log('❌ Error verifying user:', checkError.message)
} else {
  console.log('\n✅ User verified in database:')
  console.log('   Email:', user.email)
  console.log('   Employee #:', user.employee_number)
  console.log('   Status:', user.status)
  console.log('   Password Hash:', user.password_hash ? '✓ Present' : '✗ Missing')
  console.log('   Created:', user.created_at)
}
