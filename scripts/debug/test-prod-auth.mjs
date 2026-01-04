#!/usr/bin/env node
/**
 * Test production authentication for both admin and pilot portals
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Production Authentication\n')
console.log('Supabase URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? '✓ Present' : '✗ Missing')
console.log('Service Role Key:', serviceRoleKey ? '✓ Present' : '✗ Missing')
console.log('\n' + '='.repeat(60) + '\n')

// Test 1: Admin Login (Supabase Auth)
console.log('TEST 1: Admin Portal Login (Supabase Auth)')
console.log('Email: skycruzer@icloud.com')
console.log('Password: mron2393\n')

const adminClient = createClient(supabaseUrl, supabaseAnonKey)

try {
  const { data, error } = await adminClient.auth.signInWithPassword({
    email: 'skycruzer@icloud.com',
    password: 'mron2393',
  })

  if (error) {
    console.log('❌ Admin login failed:', error.message)
    console.log('Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Admin login successful!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
  }
} catch (err) {
  console.log('❌ Admin login error:', err.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test 2: Pilot Portal Login (Custom an_users)
console.log('TEST 2: Pilot Portal Login (Custom an_users)')
console.log('Email: mrondeau@airniugini.com.pg')
console.log('Password: Lemakot@1972\n')

const serviceClient = createClient(supabaseUrl, serviceRoleKey)

try {
  // Check if user exists in an_users
  const { data: user, error: userError } = await serviceClient
    .from('an_users')
    .select('*')
    .eq('email', 'mrondeau@airniugini.com.pg')
    .single()

  if (userError) {
    console.log('❌ User lookup failed:', userError.message)
  } else if (!user) {
    console.log('❌ User not found in an_users table')
  } else {
    console.log('✅ User found in database:')
    console.log('  User ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Status:', user.status)
    console.log('  Employee Number:', user.employee_number)

    // Check password (Note: In production, passwords should be hashed)
    if (user.password_hash) {
      console.log('  Password Hash:', user.password_hash ? '✓ Present' : '✗ Missing')
    } else {
      console.log('  ⚠️  WARNING: No password_hash field found')
    }
  }
} catch (err) {
  console.log('❌ Pilot login error:', err.message)
}

console.log('\n' + '='.repeat(60))
