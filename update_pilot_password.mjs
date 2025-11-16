#!/usr/bin/env node

/**
 * Update Pilot Portal Password
 * Updates password_hash in pilot_users table with bcrypt
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import bcrypt from 'bcrypt'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function updatePilotPassword() {
  console.log('\n🔐 Updating Pilot Portal Password...\n')

  const pilotEmail = 'mrondeau@airniugini.com.pg'
  const newPassword = 'mron2393'

  // Generate bcrypt hash
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(newPassword, saltRounds)

  console.log(`✅ Generated bcrypt hash for password`)

  // Update pilot_users table
  const { data, error } = await supabase
    .from('pilot_users')
    .update({ password_hash: passwordHash })
    .eq('email', pilotEmail)
    .select()

  if (error) {
    console.error('❌ Error updating password:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('\n✅ Password updated successfully!')
    console.log('\n📋 Updated User:')
    console.log(`   Email: ${data[0].email}`)
    console.log(`   Name: ${data[0].first_name} ${data[0].last_name}`)
    console.log(`   Rank: ${data[0].rank}`)
    console.log(`   Approved: ${data[0].registration_approved}`)
    console.log(`   New Password: ${newPassword}`)
    console.log('\n✨ You can now login to the pilot portal!')
  } else {
    console.log('⚠️  No user found with that email')
  }
}

updatePilotPassword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
