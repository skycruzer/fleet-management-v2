#!/usr/bin/env node
/**
 * Test admin login in production
 */

const productionUrl =
  'https://fleet-management-v2-bap3i0oc9-rondeaumaurice-5086s-projects.vercel.app'

console.log('🔍 Testing Admin Login\n')
console.log('URL:', productionUrl)
console.log('Email: skycruzer@icloud.com')
console.log('Password: mron2393\n')
console.log('='.repeat(60) + '\n')

// First, check if the route exists
console.log('TEST 1: Check if /api/auth/login route exists\n')

try {
  const response = await fetch(`${productionUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    }),
  })

  console.log('Status:', response.status)
  console.log('Status Text:', response.statusText)
  console.log('Headers:', Object.fromEntries(response.headers.entries()))

  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    console.log('\nResponse:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Admin login successful!')
    } else {
      console.log('\n❌ Admin login failed')
      console.log('Error:', data.error || data.message)
    }
  } else {
    const text = await response.text()
    console.log('\nResponse (HTML/Text):', text.substring(0, 1000))
    console.log('\n❌ Route may not exist or returned HTML instead of JSON')
  }
} catch (error) {
  console.log('❌ Request error:', error.message)
}

console.log('\n' + '='.repeat(60))

// Test direct Supabase auth
console.log('\nTEST 2: Direct Supabase Auth Test\n')

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'skycruzer@icloud.com',
    password: 'mron2393',
  })

  if (error) {
    console.log('❌ Supabase Auth failed:', error.message)
    console.log('Error code:', error.code)
  } else {
    console.log('✅ Supabase Auth successful!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
  }
} catch (error) {
  console.log('❌ Supabase Auth error:', error.message)
}

console.log('\n' + '='.repeat(60))
