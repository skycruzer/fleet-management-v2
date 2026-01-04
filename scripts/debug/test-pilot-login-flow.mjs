#!/usr/bin/env node
/**
 * Test the actual pilot login flow with RLS policies
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Pilot Login Flow (with RLS)\n')

// Use anon key (same as production)
const anonClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('TEST 1: Query pilot_users with anon key (respects RLS)')
console.log('Email: mrondeau@airniugini.com.pg\n')

const { data: pilotUser, error: pilotError } = await anonClient
  .from('pilot_users')
  .select(
    'id, email, password_hash, auth_user_id, registration_approved, first_name, last_name, rank'
  )
  .eq('email', 'mrondeau@airniugini.com.pg')
  .single()

if (pilotError) {
  console.log('❌ Query failed:', pilotError.message)
  console.log('Error code:', pilotError.code)
  console.log('Error details:', JSON.stringify(pilotError, null, 2))
  console.log('\n🔧 DIAGNOSIS: RLS policy is blocking the query')
  console.log('📝 Solution: Need to add RLS policy for pilot_users table:')
  console.log(`
-- Allow anonymous users to read pilot_users for authentication
CREATE POLICY "Allow anonymous users to read pilot_users for login"
ON pilot_users FOR SELECT
TO anon
USING (true);
  `)
} else {
  console.log('✅ Query succeeded!')
  console.log('User found:', {
    email: pilotUser.email,
    name: `${pilotUser.first_name} ${pilotUser.last_name}`,
    has_password_hash: !!pilotUser.password_hash,
    registration_approved: pilotUser.registration_approved,
  })
}
