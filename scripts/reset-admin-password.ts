/**
 * Reset Password Script
 * Developer: Maurice Rondeau
 *
 * This script resets passwords for both admin users (an_users) and pilot users (pilot_users).
 *
 * Usage:
 *   npx tsx scripts/reset-admin-password.ts                    # Reset all admin users
 *   npx tsx scripts/reset-admin-password.ts --pilot <staffId>  # Reset specific pilot by Staff ID
 *   npx tsx scripts/reset-admin-password.ts --pilot-all        # Reset all pilot users
 *
 * NOTE: This works with the CURRENT database schema.
 */

import * as bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const BCRYPT_SALT_ROUNDS = 10
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'changeme'

async function resetAdminPassword() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:')
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nMake sure .env.local is configured correctly.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔐 Resetting admin password...\n')

  // Hash the default password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)

  // Try the new `users` table first, fallback to `an_users`
  let tableName = 'users'
  let { data: admins, error: fetchError } = await supabase
    .from('users')
    .select('id, email, name, role, password_hash')
    .in('role', ['admin', 'manager'])

  // If `users` table doesn't exist, try `an_users`
  if (fetchError && fetchError.message.includes('Could not find the table')) {
    console.log('ℹ️  Using an_users table (unified auth migration not yet applied)\n')
    tableName = 'an_users'
    const result = await supabase
      .from('an_users')
      .select('id, email, name, role, password_hash')
      .in('role', ['admin', 'manager'])

    admins = result.data
    fetchError = result.error
  }

  if (fetchError) {
    console.error('❌ Failed to fetch admin users:', fetchError.message)
    process.exit(1)
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️  No admin users found in the database.')
    console.log('\nCreating a new admin user...')

    const { data: newAdmin, error: createError } = await supabase
      .from(tableName)
      .insert({
        email: 'admin@airniugini.com',
        name: 'System Administrator',
        password_hash: passwordHash,
        role: 'admin',
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create admin user:', createError.message)
      process.exit(1)
    }

    console.log('✅ Admin user created successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email: admin@airniugini.com')
    console.log('   Password: niugini')
    return
  }

  console.log(`Found ${admins.length} admin/manager user(s) in ${tableName}:\n`)

  let resetCount = 0
  for (const admin of admins) {
    const hasPassword = !!admin.password_hash
    console.log(`  • ${admin.name}`)
    console.log(`    Email: ${admin.email}`)
    console.log(`    Role: ${admin.role}`)
    console.log(`    Password set: ${hasPassword ? 'Yes' : '❌ No'}`)

    if (!hasPassword) {
      // Reset password for admins without password
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ password_hash: passwordHash })
        .eq('id', admin.id)

      if (updateError) {
        console.error(`    ❌ Failed to reset password: ${updateError.message}`)
      } else {
        console.log('    ✅ Password reset to default')
        resetCount++
      }
    }
    console.log('')
  }

  if (resetCount > 0) {
    console.log(`\n📋 Login Credentials (for ${resetCount} reset account(s)):`)
    console.log('   Password: niugini')
  } else {
    console.log('\n✅ All admin accounts already have passwords set.')
    console.log('\nIf you need to reset a password, run this SQL in Supabase:')
    console.log(`
UPDATE ${tableName}
SET password_hash = NULL
WHERE email = 'admin@airniugini.com';
`)
    console.log('Then run this script again.')
  }
}

/**
 * Reset pilot user password by Staff ID
 */
async function resetPilotPassword(staffId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:')
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nMake sure .env.local is configured correctly.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log(`🔐 Resetting password for pilot with Staff ID: ${staffId}\n`)

  // Find pilot user by employee_id (Staff ID)
  const { data: pilotUser, error: fetchError } = await supabase
    .from('pilot_users')
    .select('id, email, employee_id, first_name, last_name, registration_approved')
    .eq('employee_id', staffId)
    .single()

  if (fetchError || !pilotUser) {
    console.error(`❌ Pilot user not found with Staff ID: ${staffId}`)

    // List available pilot users for reference
    const { data: allPilots } = await supabase
      .from('pilot_users')
      .select('employee_id, first_name, last_name, email')
      .limit(10)

    if (allPilots && allPilots.length > 0) {
      console.log('\nAvailable pilot users (first 10):')
      allPilots.forEach((p) => {
        console.log(`   - Staff ID: ${p.employee_id} | ${p.first_name} ${p.last_name} (${p.email})`)
      })
    }
    process.exit(1)
  }

  console.log(`Found pilot: ${pilotUser.first_name} ${pilotUser.last_name}`)
  console.log(`   Email: ${pilotUser.email}`)
  console.log(`   Staff ID: ${pilotUser.employee_id}`)
  console.log(`   Approved: ${pilotUser.registration_approved ? 'Yes' : '❌ No'}\n`)

  // Hash the default password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)

  // Update the password
  const { error: updateError } = await supabase
    .from('pilot_users')
    .update({
      password_hash: passwordHash,
      must_change_password: true, // Require password change on next login
    })
    .eq('id', pilotUser.id)

  if (updateError) {
    console.error('❌ Failed to reset password:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Password reset successful!')
  console.log('\n📋 Login Credentials:')
  console.log(`   Staff ID: ${staffId}`)
  console.log(`   Password: ${DEFAULT_PASSWORD}`)
  console.log('\n🔗 Portal Login URL: http://localhost:3000/portal/login')
}

/**
 * Reset all pilot user passwords
 */
async function resetAllPilotPasswords() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔐 Resetting passwords for all pilot users...\n')

  const { data: pilots, error: fetchError } = await supabase
    .from('pilot_users')
    .select('id, employee_id, first_name, last_name, email')

  if (fetchError || !pilots) {
    console.error('❌ Failed to fetch pilot users:', fetchError?.message)
    process.exit(1)
  }

  console.log(`Found ${pilots.length} pilot user(s)\n`)

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)
  let resetCount = 0

  for (const pilot of pilots) {
    const { error: updateError } = await supabase
      .from('pilot_users')
      .update({
        password_hash: passwordHash,
        must_change_password: true,
      })
      .eq('id', pilot.id)

    if (updateError) {
      console.error(`❌ Failed to reset ${pilot.employee_id}: ${updateError.message}`)
    } else {
      console.log(`✅ Reset: ${pilot.employee_id} - ${pilot.first_name} ${pilot.last_name}`)
      resetCount++
    }
  }

  console.log(`\n✅ Reset ${resetCount}/${pilots.length} pilot passwords to: ${DEFAULT_PASSWORD}`)
}

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

// Parse command line arguments
const args = process.argv.slice(2)

async function main() {
  if (args.includes('--pilot')) {
    const pilotIndex = args.indexOf('--pilot')
    const staffId = args[pilotIndex + 1]

    if (!staffId) {
      console.error(
        '❌ Please provide a Staff ID: npx tsx scripts/reset-admin-password.ts --pilot <staffId>'
      )
      process.exit(1)
    }

    await resetPilotPassword(staffId)
  } else if (args.includes('--pilot-all')) {
    await resetAllPilotPasswords()
  } else {
    await resetAdminPassword()
  }
}

main()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
