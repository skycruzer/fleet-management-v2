/**
 * Diagnostic script to check pilot portal login issue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const EMAIL = 'mrondeau@airniugini.com.pg'

console.log('🔍 Checking pilot portal login for:', EMAIL)
console.log('=' .repeat(60))

async function main() {
  try {
    // 1. Check if user exists in pilot_users table
    console.log('\n1️⃣  Checking pilot_users table...')
    const { data: pilotUser, error: pilotError } = await supabase
      .from('pilot_users')
      .select('id, email, registration_approved, password_hash, first_name, last_name, rank, employee_id, last_login_at, created_at, auth_user_id')
      .eq('email', EMAIL)
      .maybeSingle()

    if (pilotError) {
      console.error('   ❌ Error querying pilot_users:', pilotError.message)

      // Check if table exists
      const { error: tableError } = await supabase
        .from('pilot_users')
        .select('*', { count: 'exact', head: true })

      if (tableError) {
        console.error('   ❌ pilot_users table may not exist:', tableError.message)
      }
      return
    }

    if (!pilotUser) {
      console.log('   ❌ User NOT FOUND in pilot_users table')

      // Check total users
      const { count } = await supabase
        .from('pilot_users')
        .select('*', { count: 'exact', head: true })

      console.log(`   ℹ️  Total users in pilot_users table: ${count || 0}`)

      // Check if similar emails exist
      const { data: similarEmails } = await supabase
        .from('pilot_users')
        .select('email')
        .ilike('email', '%rondeau%')

      if (similarEmails && similarEmails.length > 0) {
        console.log('   💡 Similar emails found:')
        similarEmails.forEach(u => console.log(`      - ${u.email}`))
      }

      console.log('\n   📝 SOLUTION: You need to register at /portal/register first!')
      return
    }

    console.log('   ✅ User found!')
    console.log('   📋 Details:')
    console.log(`      ID: ${pilotUser.id}`)
    console.log(`      Email: ${pilotUser.email}`)
    console.log(`      Name: ${pilotUser.first_name} ${pilotUser.last_name}`)
    console.log(`      Rank: ${pilotUser.rank || 'Not set'}`)
    console.log(`      Employee ID: ${pilotUser.employee_id || 'Not set'}`)
    console.log(`      Registration Approved: ${pilotUser.registration_approved === null ? 'PENDING' : (pilotUser.registration_approved ? 'YES' : 'NO')}`)
    console.log(`      Has Password Hash: ${pilotUser.password_hash ? 'YES' : 'NO'}`)
    console.log(`      Has Auth User ID: ${pilotUser.auth_user_id ? 'YES' : 'NO'}`)
    console.log(`      Last Login: ${pilotUser.last_login_at || 'Never'}`)
    console.log(`      Created: ${pilotUser.created_at}`)

    // 2. Check registration approval status
    if (pilotUser.registration_approved === null) {
      console.log('\n   ⚠️  ISSUE: Registration is PENDING admin approval')
      console.log('   📝 SOLUTION: Contact admin to approve your registration')
      return
    }

    if (pilotUser.registration_approved === false) {
      console.log('\n   ❌ ISSUE: Registration was DENIED')
      console.log('   📝 SOLUTION: Contact admin for more information')
      return
    }

    // 3. Check if password is set
    if (!pilotUser.password_hash && !pilotUser.auth_user_id) {
      console.log('\n   ❌ ISSUE: No password set')
      console.log('   📝 SOLUTION: Use password reset at /portal/forgot-password')
      return
    }

    // 4. Check for account lockouts
    console.log('\n2️⃣  Checking account lockout status...')
    const { data: lockouts, error: lockoutError } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('email', EMAIL)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lockoutError) {
      console.log('   ⚠️  Could not check lockout status:', lockoutError.message)
    } else if (lockouts && lockouts.length > 0) {
      const lockout = lockouts[0]
      const lockedUntil = new Date(lockout.locked_until)
      const now = new Date()
      const isLocked = lockedUntil > now

      console.log('   📋 Lockout record found:')
      console.log(`      Failed Attempts: ${lockout.failed_attempts}`)
      console.log(`      Locked Until: ${lockout.locked_until}`)
      console.log(`      Currently Locked: ${isLocked ? 'YES ⚠️' : 'NO ✓'}`)

      if (isLocked) {
        const minutesRemaining = Math.ceil((lockedUntil - now) / 1000 / 60)
        console.log(`\n   ❌ ISSUE: Account is locked for ${minutesRemaining} more minutes`)
        console.log('   📝 SOLUTION: Wait for lockout to expire or contact admin')
        return
      } else {
        console.log('   ✓ Lockout has expired')
      }
    } else {
      console.log('   ✓ No lockout records found')
    }

    // 5. Check if linked to pilots table
    if (pilotUser.employee_id) {
      console.log('\n3️⃣  Checking link to pilots table...')
      const { data: pilot, error: pilotLinkError } = await supabase
        .from('pilots')
        .select('id, first_name, last_name, role, employee_id, is_active')
        .eq('employee_id', pilotUser.employee_id)
        .maybeSingle()

      if (pilotLinkError) {
        console.log('   ⚠️  Could not check pilots table:', pilotLinkError.message)
      } else if (!pilot) {
        console.log(`   ⚠️  No pilot record found with employee_id: ${pilotUser.employee_id}`)
      } else {
        console.log('   ✓ Linked to pilot record:')
        console.log(`      Pilot ID: ${pilot.id}`)
        console.log(`      Name: ${pilot.first_name} ${pilot.last_name}`)
        console.log(`      Role: ${pilot.role}`)
        console.log(`      Active: ${pilot.is_active ? 'YES' : 'NO'}`)
      }
    } else {
      console.log('\n3️⃣  ⚠️  No employee_id set - not linked to pilots table yet')
    }

    // 6. Test password verification (bcrypt)
    console.log('\n4️⃣  Testing password verification...')
    if (pilotUser.password_hash) {
      const bcrypt = await import('bcrypt')
      const testPassword = 'mron2393' // The password you're trying to use
      const isValid = await bcrypt.compare(testPassword, pilotUser.password_hash)

      console.log(`   Password "mron2393" is: ${isValid ? '✅ CORRECT' : '❌ INCORRECT'}`)

      if (!isValid) {
        console.log('\n   ❌ ISSUE: Password does not match')
        console.log('   📝 SOLUTION: Use password reset at /portal/forgot-password')
        console.log('   📝 OR: Contact admin to reset your password')
      }
    } else {
      console.log('   ⚠️  No password hash to verify')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Diagnosis complete!')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error(error)
  }
}

main()
