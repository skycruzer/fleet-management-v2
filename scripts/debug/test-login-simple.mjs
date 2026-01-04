#!/usr/bin/env node

/**
 * Simple Login Test Script
 * Tests pilot portal login with detailed logging
 */

const credentials = {
  email: 'mrondeau@airniugini.com.pg',
  password: 'mron2393',
}

console.log('🧪 Testing Pilot Portal Login')
console.log('='.repeat(50))
console.log('Email:', credentials.email)
console.log('Password:', credentials.password.replace(/./g, '*'))
console.log('')

try {
  const response = await fetch('http://localhost:3000/api/portal/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    redirect: 'manual', // Don't follow redirects automatically
  })

  console.log('📡 Response Details:')
  console.log('  Status:', response.status, response.statusText)
  console.log('  Type:', response.type)
  console.log('  Redirected:', response.redirected)
  console.log('  URL:', response.url)
  console.log('')

  console.log('🍪 Response Headers:')
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}:`, value)
  }
  console.log('')

  if (response.status === 307) {
    const location = response.headers.get('location')
    const cookies = response.headers.get('set-cookie')

    console.log('✅ LOGIN SUCCESSFUL')
    console.log('  Redirect to:', location)
    console.log('  Cookies set:', cookies ? 'Yes' : 'No')

    if (cookies) {
      console.log('  Cookie details:', cookies.substring(0, 100) + '...')
    }
  } else if (response.status >= 400) {
    console.log('❌ LOGIN FAILED')
    const text = await response.text()
    console.log('  Error response:', text)
  } else {
    console.log('⚠️  UNEXPECTED STATUS CODE')
    const text = await response.text()
    console.log('  Response body:', text)
  }
} catch (error) {
  console.error('❌ TEST FAILED WITH ERROR:')
  console.error('  Error:', error.message)
  console.error('  Stack:', error.stack)
}
