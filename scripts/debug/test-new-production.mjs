#!/usr/bin/env node
/**
 * Test new production deployment authentication
 */

const productionUrl =
  'https://fleet-management-v2-bap3i0oc9-rondeaumaurice-5086s-projects.vercel.app'

console.log('🔍 Testing New Production Deployment\n')
console.log('URL:', productionUrl)
console.log('\n' + '='.repeat(60) + '\n')

// Test pilot portal login
console.log('TEST: Pilot Portal Login')
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
      password: 'Lemakot@1972',
    }),
  })

  console.log('Status:', pilotResponse.status)

  if (!pilotResponse.ok) {
    const text = await pilotResponse.text()
    console.log('Response (first 500 chars):', text.substring(0, 500))
  } else {
    const pilotData = await pilotResponse.json()
    console.log('Response:', JSON.stringify(pilotData, null, 2))
    console.log('\n✅ Pilot login successful!')
  }
} catch (error) {
  console.log('❌ Error:', error.message)
}

console.log('\n' + '='.repeat(60))
