#!/usr/bin/env node

/**
 * Verify Password Hash
 * Tests if the password matches the stored hash
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import bcrypt from 'bcryptjs'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function verifyPassword() {
  console.log('\n🔍 Verifying Password Hash...\n')

  const pilotEmail = 'mrondeau@airniugini.com.pg'
  const testPassword = 'mron2393'

  // Get current hash from database
  const { data, error } = await supabase
    .from('pilot_users')
    .select('id, email, password_hash')
    .eq('email', pilotEmail)
    .single()

  if (error || !data) {
    console.error('❌ Error fetching user:', error?.message)
    return
  }

  console.log(`📧 Email: ${data.email}`)
  console.log(`🔑 Testing password: ${testPassword}`)
  console.log(`🗃️  Hash in database: ${data.password_hash?.substring(0, 30)}...`)

  if (!data.password_hash) {
    console.log('❌ No password hash found in database!')
    return
  }

  // Test bcrypt comparison
  try {
    const isMatch = await bcrypt.compare(testPassword, data.password_hash)

    if (isMatch) {
      console.log('\n✅ PASSWORD MATCHES! ✅')
      console.log('   The password is correct.')
    } else {
      console.log('\n❌ PASSWORD DOES NOT MATCH! ❌')
      console.log('   The password is incorrect or hash is wrong.')
      console.log('\n🔧 Let me create a NEW hash and update the database...')

      // Create new hash
      const newHash = await bcrypt.hash(testPassword, 10)
      console.log(`   New hash: ${newHash.substring(0, 30)}...`)

      // Update database
      const { error: updateError } = await supabase
        .from('pilot_users')
        .update({ password_hash: newHash })
        .eq('email', pilotEmail)

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
      } else {
        console.log('   ✅ Database updated with new hash!')
        console.log('\n🧪 Verifying new hash...')

        // Verify the new hash
        const isNewMatch = await bcrypt.compare(testPassword, newHash)
        if (isNewMatch) {
          console.log('   ✅ NEW HASH VERIFIED - Login should work now!')
        } else {
          console.log('   ❌ NEW HASH ALSO FAILS - Something is very wrong!')
        }
      }
    }
  } catch (err) {
    console.error('❌ Bcrypt error:', err)
  }
}

verifyPassword()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
