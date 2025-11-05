#!/usr/bin/env node
/**
 * Check an_users table contents
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, serviceRoleKey)

console.log('🔍 Checking an_users table\n')

// Get all users
const { data: users, error } = await serviceClient
  .from('an_users')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.log('❌ Error fetching users:', error.message)
  process.exit(1)
}

console.log(`Found ${users.length} users in an_users table:\n`)

users.forEach((user, idx) => {
  console.log(`${idx + 1}. ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Status: ${user.status}`)
  console.log(`   Employee #: ${user.employee_number || 'N/A'}`)
  console.log(`   Password Hash: ${user.password_hash ? '✓ Present' : '✗ Missing'}`)
  console.log(`   Created: ${user.created_at}`)
  console.log()
})

// Check specifically for mrondeau
console.log('=' .repeat(60))
console.log('\nSearching for: mrondeau@airniugini.com.pg\n')

const { data: mrondeau, error: mError } = await serviceClient
  .from('an_users')
  .select('*')
  .eq('email', 'mrondeau@airniugini.com.pg')

if (mError) {
  console.log('❌ Error:', mError.message)
} else if (!mrondeau || mrondeau.length === 0) {
  console.log('❌ User NOT found in database')
  console.log('\n💡 To create this user, run:')
  console.log(`
INSERT INTO an_users (email, password_hash, employee_number, status)
VALUES ('mrondeau@airniugini.com.pg', crypt('Lemakot@1972', gen_salt('bf')), '001', 'active');
`)
} else {
  console.log(`✅ Found ${mrondeau.length} user(s):`)
  mrondeau.forEach(u => {
    console.log(JSON.stringify(u, null, 2))
  })
}
