/**
 * Pilot Portal API Testing Script
 * Tests the complete pilot portal workflow using fetch API
 */

const TEST_EMAIL = 'mrondeau@airniugini.com.pg'
const TEST_PASSWORD = 'Lemakot@1972'
const BASE_URL = 'http://localhost:3000'

let sessionCookie = ''

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testLogin() {
  console.log('= TEST 1: Testing Login...')

  const response = await fetch(`${BASE_URL}/api/portal/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  })

  const setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    // Extract pilot_session_token cookie
    const match = setCookieHeader.match(/pilot_session_token=([^;]+)/)
    if (match) {
      sessionCookie = `pilot_session_token=${match[1]}`
      console.log('   Session cookie extracted:', sessionCookie.substring(0, 50) + '...')
    }
  }

  const data = await response.json()

  if (response.ok) {
    console.log(' Login successful')
    console.log('  Response:', data)
    return true
  } else {
    console.log('L Login failed')
    console.log('  Status:', response.status)
    console.log('  Response:', data)
    return false
  }
}

async function testApiEndpoint(name, url) {
  console.log(`\n=� Testing ${name}: ${url}`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: sessionCookie,
    },
  })

  const contentType = response.headers.get('content-type')
  let data

  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (response.ok) {
    console.log(` ${name} - Success (${response.status})`)
    if (typeof data === 'object') {
      console.log('  Data keys:', Object.keys(data))
      if (data.data) {
        console.log('  Records:', Array.isArray(data.data) ? data.data.length : 'object')
      }
    }
    return true
  } else {
    console.log(`L ${name} - Failed (${response.status})`)
    console.log('  Response:', data)
    return false
  }
}

async function runTests() {
  console.log('=� Starting Pilot Portal API Tests...\n')
  console.log('='.repeat(80))

  try {
    // Test login first
    const loginSuccess = await testLogin()

    if (!loginSuccess) {
      console.log('\nL Login failed - aborting remaining tests')
      return
    }

    await sleep(1000)

    // Test all API endpoints
    const tests = [
      ['Profile API', `${BASE_URL}/api/portal/profile`],
      ['Certifications API', `${BASE_URL}/api/portal/certifications`],
      ['Leave Requests API', `${BASE_URL}/api/portal/leave-requests`],
      ['Leave Bids API', `${BASE_URL}/api/portal/leave-bids`],
      ['Flight Requests API', `${BASE_URL}/api/portal/flight-requests`],
    ]

    let successCount = 0
    let failCount = 0

    for (const [name, url] of tests) {
      const success = await testApiEndpoint(name, url)
      if (success) {
        successCount = successCount + 1
      } else {
        failCount = failCount + 1
      }
      await sleep(500)
    }

    console.log('\n' + '='.repeat(80))
    console.log('=� Test Summary:')
    console.log('   Passed: ' + (successCount + 1) + ' (including login)')
    console.log('  L Failed: ' + failCount)
    console.log('='.repeat(80))
  } catch (error) {
    console.error('\nL Test failed with error:', error.message)
    console.error(error)
  }
}

// Run the tests
runTests().catch(console.error)
