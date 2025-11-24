/**
 * Test script for pilot portal login API
 */

async function testLogin() {
  console.log('🧪 Testing Pilot Portal Login API...\n')

  try {
    const response = await fetch('http://localhost:3000/api/portal/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mrondeau@airniugini.com.pg',
        password: 'mron2393'
      }),
      // Don't follow redirects automatically
      redirect: 'manual'
    })

    console.log('📊 Response Status:', response.status, response.statusText)
    console.log('📊 Response Headers:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`)
    }

    // Try to parse response body
    const contentType = response.headers.get('content-type')
    console.log('\n📄 Content-Type:', contentType)

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('\n✅ Response Body:')
      console.log(JSON.stringify(data, null, 2))

      if (data.success) {
        console.log('\n✅ Login successful!')
        console.log('   Redirect to:', data.redirect)
      } else {
        console.log('\n❌ Login failed!')
        console.log('   Error:', data.error || data.message)
      }
    } else {
      const text = await response.text()
      console.log('\n📄 Response Body (text):')
      console.log(text.substring(0, 500))
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Wait for server to start
console.log('⏳ Waiting 3 seconds for dev server to start...\n')
setTimeout(testLogin, 3000)
