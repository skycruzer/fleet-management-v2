/**
 * Test complete login flow including dashboard redirect
 */

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Login Flow...\n')

  try {
    // Step 1: Login
    console.log('📝 Step 1: Attempting login...')
    const loginResponse = await fetch('http://localhost:3000/api/portal/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mrondeau@airniugini.com.pg',
        password: 'mron2393'
      }),
    })

    console.log('   Status:', loginResponse.status)

    // Extract cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    console.log('   Set-Cookie header:', setCookieHeader)

    if (!setCookieHeader) {
      console.log('   ❌ No cookie set in response!')
      return
    }

    // Parse the cookie value
    const cookieMatch = setCookieHeader.match(/pilot-session=([^;]+)/)
    if (!cookieMatch) {
      console.log('   ❌ Could not extract pilot-session cookie!')
      return
    }

    const sessionToken = cookieMatch[1]
    console.log('   ✅ Session token:', sessionToken.substring(0, 20) + '...')

    const loginData = await loginResponse.json()
    console.log('   Response:', loginData.success ? '✅ Success' : '❌ Failed')
    console.log('   Redirect:', loginData.redirect)

    if (!loginData.success) {
      console.log('   ❌ Login failed:', loginData.error)
      return
    }

    // Step 2: Try to access dashboard with cookie
    console.log('\n📝 Step 2: Accessing dashboard with session cookie...')
    const dashboardResponse = await fetch('http://localhost:3000/portal/dashboard', {
      headers: {
        'Cookie': `pilot-session=${sessionToken}`,
      },
      redirect: 'manual' // Don't follow redirects
    })

    console.log('   Status:', dashboardResponse.status)
    console.log('   Status Text:', dashboardResponse.statusText)

    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location')
      console.log('   🔄 Redirect to:', location)

      if (location && location.includes('/portal/login')) {
        console.log('   ❌ Redirected back to login - session not accepted!')
      } else {
        console.log('   ✅ Redirect looks correct')
      }
    } else if (dashboardResponse.status === 200) {
      console.log('   ✅ Dashboard accessible!')
      const html = await dashboardResponse.text()
      const hasContent = html.includes('dashboard') || html.includes('Dashboard')
      console.log('   Page content:', hasContent ? '✅ Contains dashboard content' : '⚠️  No dashboard content found')
    } else {
      console.log('   ❌ Unexpected status:', dashboardResponse.status)
      const text = await dashboardResponse.text()
      console.log('   Response:', text.substring(0, 200))
    }

    // Step 3: Test an API endpoint with the cookie
    console.log('\n📝 Step 3: Testing API access with session cookie...')
    const apiResponse = await fetch('http://localhost:3000/api/portal/leave-requests', {
      headers: {
        'Cookie': `pilot-session=${sessionToken}`,
      },
    })

    console.log('   Status:', apiResponse.status)

    if (apiResponse.status === 200) {
      const apiData = await apiResponse.json()
      console.log('   ✅ API accessible!')
      console.log('   Data received:', apiData.success ? '✅ Success' : '❌ Failed')
    } else if (apiResponse.status === 401 || apiResponse.status === 403) {
      console.log('   ❌ API rejected session - authentication failed')
      const errorData = await apiResponse.json()
      console.log('   Error:', errorData)
    } else {
      console.log('   ⚠️  Unexpected status:', apiResponse.status)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Flow test complete!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Wait for server to start
console.log('⏳ Waiting 2 seconds for dev server...\n')
setTimeout(testCompleteFlow, 2000)
