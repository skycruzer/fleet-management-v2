/**
 * Test /api/reports/preview endpoint directly
 * Check if API is returning data or empty array
 */

const API_URL = 'http://localhost:3002/api/reports/preview'

// Test Leave Requests
console.log('=== Testing Leave Requests API ===\n')
const leaveRequestBody = {
  reportType: 'leave',
  filters: {
    rosterPeriods: ['RP01/2026', 'RP02/2026'],
    status: ['SUBMITTED', 'APPROVED', 'DENIED', 'PENDING'],
  },
}

try {
  const leaveResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(leaveRequestBody),
  })

  console.log('Status:', leaveResponse.status)
  console.log('Status Text:', leaveResponse.statusText)

  const leaveData = await leaveResponse.json()
  console.log('\n📊 Leave Response Structure:')
  console.log('  - success:', leaveData.success)
  console.log('  - data type:', Array.isArray(leaveData.data) ? 'Array' : typeof leaveData.data)
  console.log('  - data length:', leaveData.data?.length || 0)

  if (leaveData.data && leaveData.data.length > 0) {
    console.log('\n✅ First record sample:')
    const first = leaveData.data[0]
    console.log(JSON.stringify(first, null, 2))
  } else {
    console.log('\n❌ No data returned!')
    console.log('Full response:', JSON.stringify(leaveData, null, 2))
  }
} catch (error) {
  console.error('❌ Leave Request Test Failed:', error.message)
}

// Test Flight Requests
console.log('\n\n=== Testing Flight Requests API ===\n')
const flightRequestBody = {
  reportType: 'flight',
  filters: {
    rosterPeriods: ['RP01/2026', 'RP02/2026'],
    status: ['SUBMITTED', 'APPROVED', 'DENIED', 'PENDING'],
  },
}

try {
  const flightResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flightRequestBody),
  })

  console.log('Status:', flightResponse.status)
  console.log('Status Text:', flightResponse.statusText)

  const flightData = await flightResponse.json()
  console.log('\n📊 Flight Response Structure:')
  console.log('  - success:', flightData.success)
  console.log('  - data type:', Array.isArray(flightData.data) ? 'Array' : typeof flightData.data)
  console.log('  - data length:', flightData.data?.length || 0)

  if (flightData.data && flightData.data.length > 0) {
    console.log('\n✅ First record sample:')
    const first = flightData.data[0]
    console.log(JSON.stringify(first, null, 2))
  } else {
    console.log('\n❌ No data returned!')
    console.log('Full response:', JSON.stringify(flightData, null, 2))
  }
} catch (error) {
  console.error('❌ Flight Request Test Failed:', error.message)
}
