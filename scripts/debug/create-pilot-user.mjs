#!/usr/bin/env node
/**
 * Create pilot user in an_users table
 *
 * Credentials come from the environment. They used to be literals in this file, which published
 * a working pilot login to a public repository.
 *
 * Usage:
 *   SEED_PILOT_EMAIL=… SEED_PILOT_PASSWORD=… node scripts/debug/create-pilot-user.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const pilotEmail = process.env.SEED_PILOT_EMAIL
const pilotPassword = process.env.SEED_PILOT_PASSWORD
const pilotEmployeeNumber = process.env.SEED_PILOT_EMPLOYEE_NUMBER ?? '001'

if (!pilotEmail || !pilotPassword) {
  console.error('❌ Set SEED_PILOT_EMAIL and SEED_PILOT_PASSWORD before running this script.')
  process.exit(1)
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey)

console.log('🔧 Creating pilot user in an_users table\n')

// Create the pilot user with hashed password
const { error } = await serviceClient.rpc('create_pilot_user', {
  p_email: pilotEmail,
  p_password: pilotPassword,
  p_employee_number: pilotEmployeeNumber,
})

if (error) {
  console.log('⚠️  RPC function not found, using direct SQL insert\n')

  // Fallback: Use raw SQL
  const { error: insertError } = await serviceClient
    .from('an_users')
    .insert({
      email: pilotEmail,
      employee_number: pilotEmployeeNumber,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()

  if (insertError) {
    console.log('❌ Failed to create user:', insertError.message)
    console.log('\n💡 You need to run this SQL directly in Supabase SQL Editor:')
    console.log(`
INSERT INTO an_users (email, password_hash, employee_number, status)
VALUES ('<email>', crypt('<password>', gen_salt('bf')), '<employee_number>', 'active');
    `)
    process.exit(1)
  } else {
    console.log('⚠️  User created but password_hash needs to be set via SQL')
    console.log('💡 Run this SQL in Supabase SQL Editor:')
    console.log(`
UPDATE an_users
SET password_hash = crypt('<password>', gen_salt('bf'))
WHERE email = '<email>';
    `)
  }
} else {
  console.log('✅ Pilot user created successfully!')
}

// Verify the user was created
const { data: user, error: checkError } = await serviceClient
  .from('an_users')
  .select('email, employee_number, status, password_hash, created_at')
  .eq('email', pilotEmail)
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
