import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 COMPREHENSIVE APPLICATION TEST')
console.log('='.repeat(60))
console.log()

// Test results tracking
const results = {
  adminLogin: false,
  adminDashboard: false,
  pilotLogin: false,
  pilotDashboard: false,
  pilotProfile: false,
  errors: []
}

// Helper function to test endpoint
async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`🔍 Testing: ${name}`)
    console.log(`   URL: ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const status = response.status
    const statusText = response.statusText

    console.log(`   Status: ${status} ${statusText}`)

    if (status >= 200 && status < 400) {
      console.log(`   ✅ SUCCESS`)
      console.log()
      return { success: true, status, response }
    } else {
      console.log(`   ❌ FAILED`)
      console.log()
      results.errors.push(`${name}: ${status} ${statusText}`)
      return { success: false, status, response }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    console.log()
    results.errors.push(`${name}: ${error.message}`)
    return { success: false, error }
  }
}

// Test Supabase connection
async function testSupabase() {
  console.log('📊 DATABASE CONNECTION TEST')
  console.log('-'.repeat(60))

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test pilots table
    const { data: pilots, error } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, rank')
      .limit(1)

    if (error) {
      console.log('❌ Database connection failed:', error.message)
      results.errors.push(`Database: ${error.message}`)
      return false
    }

    const pilotCount = pilots ? pilots.length : 0
    console.log('✅ Database connection successful')
    console.log(`   Found ${pilotCount} pilot(s) in test query`)
    console.log()
    return true
  } catch (err) {
    console.log('❌ Database error:', err.message)
    results.errors.push(`Database: ${err.message}`)
    return false
  }
}

// Test Admin Login
async function testAdminLogin() {
  console.log('👤 ADMIN LOGIN TEST')
  console.log('-'.repeat(60))

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393'
    })

    if (error) {
      console.log('❌ Admin login failed:', error.message)
      results.errors.push(`Admin Login: ${error.message}`)
      results.adminLogin = false
      return null
    }

    const role = data.user.user_metadata && data.user.user_metadata.role ? data.user.user_metadata.role : 'NOT SET'

    console.log('✅ Admin login successful')
    console.log(`   User ID: ${data.user.id}`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Role: ${role}`)
    console.log()

    results.adminLogin = true
    return data.session.access_token
  } catch (err) {
    console.log('❌ Admin login error:', err.message)
    results.errors.push(`Admin Login: ${err.message}`)
    results.adminLogin = false
    return null
  }
}

// Test Pilot Login
async function testPilotLogin() {
  console.log('✈️  PILOT LOGIN TEST')
  console.log('-'.repeat(60))

  try {
    const response = await fetch('http://localhost:3000/api/portal/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mrondeau@airniugini.com.pg',
        password: 'Lemakot@1972'
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      const errorMsg = data.error || 'Unknown error'
      console.log('❌ Pilot login failed:', errorMsg)
      results.errors.push(`Pilot Login: ${errorMsg}`)
      results.pilotLogin = false
      return null
    }

    // Extract cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie')
    let sessionToken = null

    if (setCookie) {
      const match = setCookie.match(/pilot_session=([^;]+)/)
      if (match) {
        sessionToken = match[1]
      }
    }

    console.log('✅ Pilot login successful')
    console.log(`   Pilot: ${data.data.first_name} ${data.data.last_name}`)
    console.log(`   Rank: ${data.data.rank}`)
    console.log(`   Has Session: ${sessionToken ? 'Yes' : 'No'}`)
    console.log()

    results.pilotLogin = true
    return sessionToken
  } catch (err) {
    console.log('❌ Pilot login error:', err.message)
    results.errors.push(`Pilot Login: ${err.message}`)
    results.pilotLogin = false
    return null
  }
}

// Run all tests
async function runTests() {
  console.log()

  // Test 1: Database
  await testSupabase()

  // Test 2: Admin Login
  const adminToken = await testAdminLogin()

  // Test 3: Admin Dashboard
  if (adminToken) {
    const dashboardTest = await testEndpoint(
      'Admin Dashboard',
      'http://localhost:3000/dashboard',
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        }
      }
    )
    results.adminDashboard = dashboardTest.success
  }

  // Test 4: Pilot Login
  const pilotSession = await testPilotLogin()

  // Test 5: Pilot Dashboard
  if (pilotSession) {
    const pilotDashboardTest = await testEndpoint(
      'Pilot Dashboard',
      'http://localhost:3000/portal/dashboard',
      {
        headers: {
          'Cookie': `pilot_session=${pilotSession}`,
        }
      }
    )
    results.pilotDashboard = pilotDashboardTest.success
  }

  // Test 6: Pilot Profile
  if (pilotSession) {
    const profileTest = await testEndpoint(
      'Pilot Profile',
      'http://localhost:3000/portal/profile',
      {
        headers: {
          'Cookie': `pilot_session=${pilotSession}`,
        }
      }
    )
    results.pilotProfile = profileTest.success
  }

  // Print Summary
  console.log()
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log()

  const tests = [
    { name: 'Database Connection', result: !results.errors.some(e => e.startsWith('Database:')) },
    { name: 'Admin Login', result: results.adminLogin },
    { name: 'Admin Dashboard', result: results.adminDashboard },
    { name: 'Pilot Login', result: results.pilotLogin },
    { name: 'Pilot Dashboard', result: results.pilotDashboard },
    { name: 'Pilot Profile', result: results.pilotProfile },
  ]

  let passed = 0
  let failed = 0

  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${test.name}`)
    if (test.result) passed++
    else failed++
  })

  console.log()
  console.log(`Total: ${passed} passed, ${failed} failed`)

  if (results.errors.length > 0) {
    console.log()
    console.log('❌ ERRORS:')
    results.errors.forEach(error => {
      console.log(`   • ${error}`)
    })
  }

  console.log()

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is ready for deployment.')
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please fix issues before deployment.')
  }

  console.log()
}

runTests().catch(console.error)
