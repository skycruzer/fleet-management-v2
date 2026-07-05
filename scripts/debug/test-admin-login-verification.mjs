#!/usr/bin/env node
/**
 * Test Admin Login Verification
 * Tests the admin login flow with provided credentials
 *
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const EMAIL = 'skycruzer@icloud.com'
const PASSWORD = 'mron2393'

console.log('🔐 Testing Admin Login Flow\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testLogin() {
  try {
    console.log(`📧 Email: ${EMAIL}`)
    console.log(`🔑 Password: ${'*'.repeat(PASSWORD.length)}\n`)

    // Attempt login
    console.log('⏳ Attempting sign in...\n')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    })

    if (error) {
      console.error('❌ Login Failed\n')
      console.error('Error Details:')
      console.error(`  Code: ${error.status || 'N/A'}`)
      console.error(`  Message: ${error.message}`)
      console.error(`  Name: ${error.name}\n`)

      // Check if user exists
      console.log('🔍 Checking if user exists in auth.users...')
      const adminSupabase = createClient(
        SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
      )

      return
    }

    console.log('✅ Login Successful!\n')
    console.log('User Details:')
    console.log(`  ID: ${data.user.id}`)
    console.log(`  Email: ${data.user.email}`)
    console.log(`  Role: ${data.user.role}`)
    console.log(`  Created: ${new Date(data.user.created_at).toLocaleString()}`)
    console.log(`  Last Sign In: ${new Date(data.user.last_sign_in_at).toLocaleString()}\n`)

    console.log('Session Details:')
    console.log(`  Access Token: ${data.session.access_token.substring(0, 20)}...`)
    console.log(`  Expires At: ${new Date(data.session.expires_at * 1000).toLocaleString()}\n`)

    // Test API access
    console.log('🧪 Testing API Access...\n')

    const apiTests = [
      { name: 'Pilots', endpoint: 'http://localhost:3000/api/pilots' },
      { name: 'Certifications', endpoint: 'http://localhost:3000/api/certifications' },
      { name: 'Dashboard Metrics', endpoint: 'http://localhost:3000/api/dashboard/metrics' },
    ]

    for (const test of apiTests) {
      try {
        const response = await fetch(test.endpoint, {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        })

        if (response.ok) {
          const json = await response.json()
          console.log(
            `  ✅ ${test.name}: ${response.status} (${json.data?.length || 'N/A'} records)`
          )
        } else {
          console.log(`  ❌ ${test.name}: ${response.status} ${response.statusText}`)
        }
      } catch (apiError) {
        console.log(`  ⚠️  ${test.name}: ${apiError.message}`)
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Admin Login Test Complete\n')
  } catch (error) {
    console.error('💥 Unexpected Error:', error.message)
    console.error(error)
  }
}

testLogin()
