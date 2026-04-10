#!/usr/bin/env node
/**
 * Check pilot_users table contents
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, serviceRoleKey)

console.log('🔍 Checking pilot_users table\n')

// Get all users
const { data: users, error } = await serviceClient
  .from('pilot_users')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.log('❌ Error fetching users:', error.message)
  process.exit(1)
}

console.log(`Found ${users.length} users in pilot_users table:\n`)

users.forEach((user, idx) => {
  console.log(`${idx + 1}. ID: ${user.id}`)
  console.log(`   Name: ${user.first_name} ${user.last_name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Employee ID: ${user.employee_id || 'N/A'}`)
  console.log(`   Pilot ID: ${user.pilot_id || 'N/A'}`)
  console.log(`   Rank: ${user.rank || 'N/A'}`)
  console.log(`   Seniority #: ${user.seniority_number || 'N/A'}`)
  console.log(`   Password Hash: ${user.password_hash ? '✓ Present' : '✗ Missing'}`)
  console.log(`   Registration Approved: ${user.registration_approved ? '✓ Yes' : '✗ No'}`)
  console.log(`   Created: ${user.created_at}`)
  console.log()
})

// Check specifically for mrondeau
console.log('='.repeat(60))
console.log('\nSearching for: mrondeau@airniugini.com.pg\n')

const { data: mrondeau, error: mError } = await serviceClient
  .from('pilot_users')
  .select('*')
  .eq('email', 'mrondeau@airniugini.com.pg')

if (mError) {
  console.log('❌ Error:', mError.message)
} else if (!mrondeau || mrondeau.length === 0) {
  console.log('❌ User NOT found in database')
  console.log('\n💡 This user needs to be created in the pilot_users table')
} else {
  console.log(`✅ Found ${mrondeau.length} user(s):`)
  mrondeau.forEach((u) => {
    console.log(JSON.stringify(u, null, 2))
  })
}
