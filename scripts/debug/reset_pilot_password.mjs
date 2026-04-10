#!/usr/bin/env node

/**
 * Reset Pilot Portal Password
 * Resets password for pilot user using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function resetPilotPassword() {
  console.log('\n🔐 Resetting Pilot Password...\n')

  const pilotEmail = 'mrondeau@airniugini.com.pg'
  const newPassword = 'mron2393'
  const userId = 'a1418a40-bde1-4482-ae4b-20905ffba49c'

  // Update user password using Admin API
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    console.error('❌ Error resetting password:', error.message)
    return
  }

  console.log('✅ Password reset successful!')
  console.log('\n📋 Updated User:')
  console.log(`   Email: ${data.user.email}`)
  console.log(`   ID: ${data.user.id}`)
  console.log(`   New Password: ${newPassword}`)
  console.log('\n✨ You can now login to the pilot portal with these credentials.')
}

resetPilotPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
