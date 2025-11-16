#!/usr/bin/env node

/**
 * Check an_users Table Structure and Users
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

async function checkAnUsersTable() {
  console.log('\n🔍 Checking an_users Table...\n')

  // Get all users (minimal columns first to see what exists)
  const { data: users, error } = await supabase
    .from('an_users')
    .select('*')
    .limit(10)

  if (error) {
    console.error('❌ Error querying an_users:', error.message)
    return
  }

  console.log(`📊 Found ${users.length} users in an_users table\n`)

  if (users.length > 0) {
    console.log('📋 Table Columns:')
    const columns = Object.keys(users[0])
    columns.forEach(col => {
      console.log(`   - ${col}`)
    })

    console.log('\n👥 Users:')
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email || 'NO EMAIL'}`)
      Object.entries(user).forEach(([key, value]) => {
        if (key !== 'password_hash' && key !== 'password') {
          console.log(`   ${key}: ${value}`)
        } else {
          console.log(`   ${key}: ***HIDDEN***`)
        }
      })
    })
  } else {
    console.log('⚠️  No users found in an_users table')
  }
}

checkAnUsersTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
