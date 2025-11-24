#!/usr/bin/env node

/**
 * Check Pilot Portal Credentials
 * Queries an_users table to verify pilot account
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPilotCredentials() {
  console.log('\n🔍 Checking Pilot Portal Credentials...\n')

  const pilotEmail = 'mrondeau@airniugini.com.pg'

  // Query an_users table for this email
  const { data: users, error } = await supabase
    .from('an_users')
    .select('*')
    .eq('email', pilotEmail)

  if (error) {
    console.error('❌ Error querying an_users:', error.message)
    return
  }

  if (!users || users.length === 0) {
    console.log(`❌ No user found with email: ${pilotEmail}`)
    console.log('\n📋 Let me check ALL users in an_users table...\n')

    // Get all users
    const { data: allUsers, error: allError } = await supabase
      .from('an_users')
      .select('id, email, employee_number, status, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error getting all users:', allError.message)
      return
    }

    console.log(`Found ${allUsers.length} total users:`)
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`)
      console.log(`   Employee#: ${user.employee_number}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Created: ${user.created_at}`)
    })

    return
  }

  // User found - display details (excluding password hash)
  const user = users[0]
  console.log('✅ User found!')
  console.log('\n📋 User Details:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Employee Number: ${user.employee_number}`)
  console.log(`   Status: ${user.status}`)
  console.log(`   Created: ${user.created_at}`)
  console.log(`   Updated: ${user.updated_at}`)
  console.log(`   Password Hash: ${user.password_hash ? '***HIDDEN***' : 'NOT SET'}`)

  // Check if linked to pilots table
  if (user.employee_number) {
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, rank, status')
      .eq('employee_number', user.employee_number)
      .single()

    if (pilot) {
      console.log('\n✅ Linked to Pilot:')
      console.log(`   Name: ${pilot.first_name} ${pilot.last_name}`)
      console.log(`   Rank: ${pilot.rank}`)
      console.log(`   Status: ${pilot.status}`)
    } else {
      console.log('\n⚠️  Not linked to any pilot record')
    }
  }

  console.log('\n⚠️  NOTE: Password hashes are encrypted and cannot be displayed.')
  console.log('   To reset password, use the pilot portal password reset feature.')
  console.log('   Or update password hash manually using bcrypt.')
}

checkPilotCredentials()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
