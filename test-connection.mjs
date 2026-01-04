#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 *
 * This script verifies the connection to the existing Supabase database
 * and checks that we can access the production data (27 pilots, 571 certifications).
 *
 * Usage: node test-connection.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

// Parse environment variables
const env = {}
envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🔍 Testing Supabase Connection...\n')
console.log('📡 Supabase URL:', SUPABASE_URL)
console.log(
  '🔑 Anon Key:',
  SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT FOUND'
)
console.log('')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local')
  console.error(
    '   Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testConnection() {
  try {
    // Test 1: Fetch pilots count
    console.log('📊 Test 1: Fetching pilots...')
    const {
      data: pilots,
      error: pilotsError,
      count: pilotsCount,
    } = await supabase.from('pilots').select('*', { count: 'exact' })

    if (pilotsError) {
      throw new Error(`Pilots query failed: ${pilotsError.message}`)
    }

    console.log(`   ✅ Found ${pilotsCount} pilots`)
    console.log(
      `   📋 Sample pilot: ${pilots[0]?.first_name} ${pilots[0]?.last_name} (${pilots[0]?.employee_id})`
    )
    console.log('')

    // Test 2: Fetch pilot_checks count
    console.log('📊 Test 2: Fetching pilot certifications...')
    const { count: checksCount, error: checksError } = await supabase
      .from('pilot_checks')
      .select('*', { count: 'exact', head: true })

    if (checksError) {
      throw new Error(`Pilot checks query failed: ${checksError.message}`)
    }

    console.log(`   ✅ Found ${checksCount} pilot certifications`)
    console.log('')

    // Test 3: Fetch check_types count
    console.log('📊 Test 3: Fetching check types...')
    const { count: checkTypesCount, error: checkTypesError } = await supabase
      .from('check_types')
      .select('*', { count: 'exact', head: true })

    if (checkTypesError) {
      throw new Error(`Check types query failed: ${checkTypesError.message}`)
    }

    console.log(`   ✅ Found ${checkTypesCount} check types`)
    console.log('')

    // Test 4: Fetch leave_requests count
    console.log('📊 Test 4: Fetching leave requests...')
    const { count: leaveCount, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })

    if (leaveError) {
      throw new Error(`Leave requests query failed: ${leaveError.message}`)
    }

    console.log(`   ✅ Found ${leaveCount} leave requests`)
    console.log('')

    // Test 5: Fetch an_users count
    console.log('📊 Test 5: Fetching system users...')
    const { count: usersCount, error: usersError } = await supabase
      .from('an_users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      throw new Error(`Users query failed: ${usersError.message}`)
    }

    console.log(`   ✅ Found ${usersCount} system users`)
    console.log('')

    // Test 6: Test database views
    console.log('📊 Test 6: Testing database views...')
    const { error: viewError } = await supabase.from('expiring_checks').select('*').limit(1)

    if (viewError) {
      console.log(`   ⚠️  expiring_checks view: ${viewError.message}`)
    } else {
      console.log(`   ✅ expiring_checks view is accessible`)
    }
    console.log('')

    // Summary
    console.log('═══════════════════════════════════════════════════════════')
    console.log('🎉 Connection Test Summary')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`✅ Database Connection: SUCCESS`)
    console.log(`✅ Pilots: ${pilotsCount}`)
    console.log(`✅ Certifications: ${checksCount}`)
    console.log(`✅ Check Types: ${checkTypesCount}`)
    console.log(`✅ Leave Requests: ${leaveCount}`)
    console.log(`✅ System Users: ${usersCount}`)
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('🚀 All systems operational! Ready to proceed with development.')
    console.log('')
  } catch (error) {
    console.error('')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('❌ Connection Test Failed')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', error.message)
    console.error('═══════════════════════════════════════════════════════════')
    console.error('')
    process.exit(1)
  }
}

// Run the test
testConnection()
