#!/usr/bin/env node
/**
 * Check an_users Table Schema and Data
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('🔍 Checking an_users Table\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function checkSchema() {
  try {
    // Get all users from an_users
    console.log('📊 Fetching all users from an_users table...\n')
    const { data: users, error } = await supabase.from('an_users').select('*').limit(10)

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in an_users table')
      console.log('\n🔍 Checking auth.users for skycruzer@icloud.com...\n')

      // Check if user exists in auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.error('❌ Error fetching auth users:', authError.message)
        return
      }

      const targetUser = authUsers.users.find((u) => u.email === 'skycruzer@icloud.com')

      if (targetUser) {
        console.log('✅ User found in auth.users:')
        console.log(`   ID: ${targetUser.id}`)
        console.log(`   Email: ${targetUser.email}`)
        console.log(`   Created: ${new Date(targetUser.created_at).toLocaleString()}`)
        console.log(
          `   Last Sign In: ${targetUser.last_sign_in_at ? new Date(targetUser.last_sign_in_at).toLocaleString() : 'Never'}`
        )

        console.log('\n⚠️  User exists in auth.users but NOT in an_users table')
        console.log('   This is why login succeeds but dashboard access fails!\n')

        console.log('💡 SOLUTION: Create an_users record for this user')
        console.log('   Run this SQL in Supabase SQL Editor:\n')
        console.log(`   INSERT INTO an_users (id, email, role, created_at, updated_at)`)
        console.log(`   VALUES ('${targetUser.id}', '${targetUser.email}', 'admin', NOW(), NOW());`)
      } else {
        console.log('❌ User not found in auth.users either!')
        console.log('   You need to create a user account first.')
      }

      return
    }

    console.log(`✅ Found ${users.length} users in an_users table:\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.email || user.id}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Role: ${user.role || 'N/A'}`)
      console.log(
        `   Created: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}`
      )
      console.log('')
    })

    // Check for skycruzer@icloud.com specifically
    const targetUser = users.find((u) => u.email === 'skycruzer@icloud.com')

    if (targetUser) {
      console.log('✅ Found skycruzer@icloud.com in an_users table')
      console.log('   Login should work!')
    } else {
      console.log('⚠️  skycruzer@icloud.com NOT found in an_users table')
      console.log('   This is why dashboard access fails after login!')
    }
  } catch (error) {
    console.error('💥 Unexpected Error:', error.message)
    console.error(error)
  }
}

checkSchema()
