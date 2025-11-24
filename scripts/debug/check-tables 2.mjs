#!/usr/bin/env node

/**
 * Check Database Tables
 * Verifies which tables exist in the database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('\n📋 Checking Database Tables...\n')

  // Check for pilot-related tables
  const tablesToCheck = [
    'pilot_users',
    'pilot_sessions',
    'failed_login_attempts',
    'pilots',
    'an_users'
  ]

  for (const tableName of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: EXISTS (${count} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }

  // Check RLS status on failed_login_attempts
  console.log('\n🔒 Checking RLS Status...\n')

  const { data: rlsData, error: rlsError } = await supabase
    .rpc('pg_tables_info')
    .select('tablename, rowsecurity')
    .in('tablename', ['failed_login_attempts', 'pilot_sessions'])

  if (rlsError) {
    console.log('⚠️  Could not check RLS status (requires custom function)')
  } else if (rlsData) {
    console.log('RLS Status:', rlsData)
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
