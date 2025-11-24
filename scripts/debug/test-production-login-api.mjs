#!/usr/bin/env node
/**
 * Test production login API endpoint
 */

console.log('🔍 Testing Production Login API\n')

// Get production URL from Vercel output or use default
const productionUrl = process.env.VERCEL_URL || 'https://fleet-management-v2-lg2a5gbpg-rondeaumaurice-5086s-projects.vercel.app'

console.log('Production URL:', productionUrl)
console.log('\n' + '='.repeat(60) + '\n')

// Test admin login
console.log('TEST 1: Admin Portal Login')
console.log('POST /api/auth/login')
console.log('Email: skycruzer@icloud.com\n')

try {
  const adminResponse = await fetch(`${productionUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'skycruzer@icloud.com',
      password: 'mron2393'
    })
  })

  const adminData = await adminResponse.json()

  console.log('Status:', adminResponse.status)
  console.log('Response:', JSON.stringify(adminData, null, 2))

  if (adminResponse.ok) {
    console.log('✅ Admin login successful!')
  } else {
    console.log('❌ Admin login failed')
  }
} catch (error) {
  console.log('❌ Admin login error:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test pilot portal login
console.log('TEST 2: Pilot Portal Login')
console.log('POST /api/portal/login')
console.log('Email: mrondeau@airniugini.com.pg\n')

try {
  const pilotResponse = await fetch(`${productionUrl}/api/portal/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'mrondeau@airniugini.com.pg',
      password: 'Lemakot@1972'
    })
  })

  const pilotData = await pilotResponse.json()

  console.log('Status:', pilotResponse.status)
  console.log('Response:', JSON.stringify(pilotData, null, 2))

  if (pilotResponse.ok) {
    console.log('✅ Pilot login successful!')
  } else {
    console.log('❌ Pilot login failed')
  }
} catch (error) {
  console.log('❌ Pilot login error:', error.message)
}

console.log('\n' + '='.repeat(60))
