import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const baseUrl = 'http://localhost:3000'

console.log('🧪 COMPREHENSIVE BROWSER TEST')
console.log('='.repeat(80))
console.log()

// Test results
const results = {
  adminTests: { passed: 0, failed: 0, tests: [] },
  pilotTests: { passed: 0, failed: 0, tests: [] },
  errors: []
}

// Helper: Test endpoint and record result
async function testPage(testName, url, options = {}) {
  try {
    console.log(`🔍 Testing: ${testName}`)
    console.log(`   URL: ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        ...options.headers,
      },
      redirect: 'manual'  // Don't follow redirects automatically
    })

    const status = response.status
    const statusText = response.statusText
    const location = response.headers.get('location')

    console.log(`   Status: ${status} ${statusText}`)
    if (location) {
      console.log(`   Redirects to: ${location}`)
    }

    // Success conditions
    const isSuccess = (
      (status >= 200 && status < 300) ||  // OK responses
      (status >= 300 && status < 400 && location)  // Redirects are OK for authenticated pages
    )

    if (isSuccess) {
      console.log(`   ✅ SUCCESS`)
      console.log()
      return { success: true, status, response, location }
    } else {
      console.log(`   ❌ FAILED`)
      console.log()
      return { success: false, status, response }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    console.log()
    return { success: false, error }
  }
}

// Test Admin Login
async function testAdminLogin() {
  console.log('=' .repeat(80))
  console.log('👤 ADMIN PORTAL TESTS')
  console.log('='.repeat(80))
  console.log()

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Admin Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393'
    })

    if (error) {
      console.log('❌ Admin login failed:', error.message)
      results.adminTests.failed++
      results.adminTests.tests.push({ name: 'Admin Login', status: 'FAIL' })
      return null
    }

    const accessToken = data.session.access_token
    const role = data.user.user_metadata?.role || 'NOT SET'

    console.log('✅ Admin login successful')
    console.log(`   User ID: ${data.user.id}`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Role: ${role}`)
    console.log()

    results.adminTests.passed++
    results.adminTests.tests.push({ name: 'Admin Login', status: 'PASS' })

    return accessToken
  } catch (err) {
    console.log('❌ Admin login error:', err.message)
    results.adminTests.failed++
    results.adminTests.tests.push({ name: 'Admin Login', status: 'FAIL' })
    return null
  }
}

// Test Pilot Login
async function testPilotLogin() {
  console.log('='.repeat(80))
  console.log('✈️  PILOT PORTAL TESTS')
  console.log('='.repeat(80))
  console.log()

  try {
    const response = await fetch(`${baseUrl}/api/portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mrondeau@airniugini.com.pg',
        password: 'Lemakot@1972'
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      const errorMsg = data.error || 'Unknown error'
      console.log('❌ Pilot login failed:', errorMsg)
      results.pilotTests.failed++
      results.pilotTests.tests.push({ name: 'Pilot Login', status: 'FAIL' })
      return null
    }

    // Extract cookie
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

    results.pilotTests.passed++
    results.pilotTests.tests.push({ name: 'Pilot Login', status: 'PASS' })

    return sessionToken
  } catch (err) {
    console.log('❌ Pilot login error:', err.message)
    results.pilotTests.failed++
    results.pilotTests.tests.push({ name: 'Pilot Login', status: 'FAIL' })
    return null
  }
}

// Test Admin Pages
async function testAdminPages(accessToken) {
  console.log('🧭 Testing Admin Portal Pages')
  console.log('-'.repeat(80))
  console.log()

  const pages = [
    { name: 'Admin Dashboard', url: `${baseUrl}/dashboard` },
    { name: 'Pilots Page', url: `${baseUrl}/dashboard/pilots` },
    { name: 'Certifications Page', url: `${baseUrl}/dashboard/certifications` },
    { name: 'Leave Requests Page', url: `${baseUrl}/dashboard/leave` },
    { name: 'Analytics Page', url: `${baseUrl}/dashboard/analytics` },
    { name: 'Settings Page', url: `${baseUrl}/dashboard/settings` }
  ]

  for (const page of pages) {
    const result = await testPage(
      page.name,
      page.url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `sb-access-token=${accessToken}`
        }
      }
    )

    if (result.success) {
      results.adminTests.passed++
      results.adminTests.tests.push({ name: page.name, status: 'PASS' })
    } else {
      results.adminTests.failed++
      results.adminTests.tests.push({ name: page.name, status: 'FAIL' })
      results.errors.push(`${page.name}: ${result.status || result.error.message}`)
    }
  }
}

// Test Pilot Pages
async function testPilotPages(sessionToken) {
  console.log('🧭 Testing Pilot Portal Pages')
  console.log('-'.repeat(80))
  console.log()

  const pages = [
    { name: 'Pilot Dashboard', url: `${baseUrl}/portal/dashboard` },
    { name: 'Pilot Profile', url: `${baseUrl}/portal/profile` },
    { name: 'Pilot Certifications', url: `${baseUrl}/portal/certifications` },
    { name: 'Leave Requests', url: `${baseUrl}/portal/leave-requests` },
    { name: 'Flight Requests', url: `${baseUrl}/portal/flight-requests` },
    { name: 'Feedback Page', url: `${baseUrl}/portal/feedback` }
  ]

  for (const page of pages) {
    const result = await testPage(
      page.name,
      page.url,
      {
        headers: {
          'Cookie': `pilot_session=${sessionToken}`
        }
      }
    )

    if (result.success) {
      results.pilotTests.passed++
      results.pilotTests.tests.push({ name: page.name, status: 'PASS' })
    } else {
      results.pilotTests.failed++
      results.pilotTests.tests.push({ name: page.name, status: 'FAIL' })
      results.errors.push(`${page.name}: ${result.status || result.error.message}`)
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log()

  // Test Admin Portal
  const adminToken = await testAdminLogin()
  if (adminToken) {
    await testAdminPages(adminToken)
  }

  console.log()

  // Test Pilot Portal
  const pilotSession = await testPilotLogin()
  if (pilotSession) {
    await testPilotPages(pilotSession)
  }

  // Print Summary
  console.log()
  console.log('=' .repeat(80))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(80))
  console.log()

  const totalPassed = results.adminTests.passed + results.pilotTests.passed
  const totalFailed = results.adminTests.failed + results.pilotTests.failed
  const totalTests = totalPassed + totalFailed

  console.log('📊 Admin Portal:')
  console.log(`   Passed: ${results.adminTests.passed}`)
  console.log(`   Failed: ${results.adminTests.failed}`)
  console.log()

  console.log('📊 Pilot Portal:')
  console.log(`   Passed: ${results.pilotTests.passed}`)
  console.log(`   Failed: ${results.pilotTests.failed}`)
  console.log()

  console.log('📊 Overall:')
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   Passed: ${totalPassed}`)
  console.log(`   Failed: ${totalFailed}`)
  console.log(`   Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`)
  console.log()

  if (results.errors.length > 0) {
    console.log('❌ ERRORS:')
    results.errors.forEach(error => {
      console.log(`   • ${error}`)
    })
    console.log()
  }

  // Detailed Test Results
  console.log('📝 Detailed Test Results:')
  console.log()
  console.log('Admin Portal Tests:')
  results.adminTests.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌'
    console.log(`${icon} ${test.name}`)
  })
  console.log()

  console.log('Pilot Portal Tests:')
  results.pilotTests.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌'
    console.log(`${icon} ${test.name}`)
  })
  console.log()

  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is ready for deployment.')
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review and fix issues before deployment.')
  }

  console.log()
  console.log('='.repeat(80))
}

runAllTests().catch(console.error)
