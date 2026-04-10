#!/usr/bin/env node
/**
 * Reset Pilot Portal Password
 *
 * Usage: node reset-pilot-password.mjs <email> <new-password>
 * Example: node reset-pilot-password.mjs mrondeau@airniugini.com.pg MyNewPass123
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import bcrypt from 'bcryptjs'

// Load environment variables
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function resetPassword(email, newPassword) {
  console.log('\n🔐 Resetting Pilot Portal Password')
  console.log('=====================================\n')

  if (!email || !newPassword) {
    console.error('❌ Error: Email and password required')
    console.log('\nUsage: node reset-pilot-password.mjs <email> <new-password>')
    console.log('Example: node reset-pilot-password.mjs pilot@airniugini.com.pg MyNewPass123\n')
    process.exit(1)
  }

  // Validate password strength
  if (newPassword.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long\n')
    process.exit(1)
  }

  try {
    // Find pilot user
    console.log(`📧 Looking up pilot user: ${email}`)
    const { data: pilotUser, error: findError } = await supabase
      .from('pilot_users')
      .select('id, email, first_name, last_name, registration_approved')
      .eq('email', email)
      .single()

    if (findError || !pilotUser) {
      console.error(`❌ Error: Pilot user not found for email: ${email}`)
      console.log('\nAvailable pilot users:')
      const { data: allUsers } = await supabase
        .from('pilot_users')
        .select('email, first_name, last_name')
      allUsers?.forEach((u) => console.log(`   - ${u.email} (${u.first_name} ${u.last_name})`))
      console.log('')
      process.exit(1)
    }

    console.log(`✅ Found: ${pilotUser.first_name} ${pilotUser.last_name}`)
    console.log(`   Approved: ${pilotUser.registration_approved ? 'YES' : 'NO'}\n`)

    if (!pilotUser.registration_approved) {
      console.warn('⚠️  Warning: User registration not approved yet\n')
    }

    // Hash new password
    console.log('🔒 Hashing new password...')
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    // Update password
    console.log('💾 Updating password in database...')
    const { error: updateError } = await supabase
      .from('pilot_users')
      .update({ password_hash: passwordHash })
      .eq('id', pilotUser.id)

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message)
      process.exit(1)
    }

    console.log('\n✅ Password reset successful!\n')
    console.log('You can now log in at:')
    console.log(`   Portal URL: http://localhost:3003/portal/login`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
    console.log('\n⚠️  Remember to change this password after first login!\n')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Get command line arguments
const [, , email, newPassword] = process.argv

resetPassword(email, newPassword)
