/**
 * Test Pilot Portal Login API Endpoint
 */

const BASE_URL = 'http://localhost:3000'

async function testLoginAPI() {
  console.log('Testing /api/portal/login endpoint...\n')

  try {
    const response = await fetch(`${BASE_URL}/api/portal/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mrondeau@airniugini.com.pg',
        password: 'Lemakot@1972',
      }),
    })

    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('\nHeaders:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })

    const data = await response.json()
    console.log('\nResponse Body:')
    console.log(JSON.stringify(data, null, 2))

    if (response.ok && data.success) {
      console.log('\n✅ Login API works correctly!')
    } else {
      console.log('\n❌ Login API failed:', data.error || data.message)
    }
  } catch (error) {
    console.error('❌ Error testing login API:', error.message)
  }
}

testLoginAPI()
