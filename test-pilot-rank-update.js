/**
 * Test Pilot Rank Update Issue
 * Tests if pilot rank persists after update
 */

const BASE_URL = 'http://localhost:3000'

// Get pilot data
async function getPilot(pilotId, cookie) {
  const response = await fetch(`${BASE_URL}/api/pilots/${pilotId}`, {
    headers: {
      Cookie: cookie,
    },
  })
  return await response.json()
}

// Update pilot
async function updatePilot(pilotId, data, cookie) {
  const response = await fetch(`${BASE_URL}/api/pilots/${pilotId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(data),
  })
  return await response.json()
}

// Login and get session
async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    }),
  })

  const cookies = response.headers.get('set-cookie')
  return cookies
}

async function testRankUpdate() {
  console.log('\n🧪 TESTING PILOT RANK UPDATE\n')
  console.log('='.repeat(80))

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...')
    const cookie = await login()
    if (!cookie) {
      console.error('❌ Login failed - no cookie received')
      return
    }
    console.log('✅ Login successful')

    // Step 2: Get first pilot
    console.log('\n📝 Step 2: Fetching first pilot...')
    const pilotsResponse = await fetch(`${BASE_URL}/api/pilots?limit=1`, {
      headers: { Cookie: cookie },
    })
    const pilotsData = await pilotsResponse.json()

    if (!pilotsData.success || !pilotsData.data || pilotsData.data.length === 0) {
      console.error('❌ No pilots found')
      return
    }

    const pilotId = pilotsData.data[0].id
    console.log('✅ Found pilot:', pilotId)

    // Step 3: Get current pilot data
    console.log('\n📝 Step 3: Getting current pilot data...')
    const currentData = await getPilot(pilotId, cookie)
    console.log('Current rank:', currentData.data.role)
    console.log('Current name:', `${currentData.data.first_name} ${currentData.data.last_name}`)

    const originalRank = currentData.data.role
    const newRank = originalRank === 'Captain' ? 'First Officer' : 'Captain'

    console.log(`\n🔄 Will change rank from "${originalRank}" to "${newRank}"`)

    // Step 4: Update rank
    console.log('\n📝 Step 4: Updating pilot rank...')
    const updateData = {
      employee_id: currentData.data.employee_id,
      first_name: currentData.data.first_name,
      last_name: currentData.data.last_name,
      role: newRank,
      is_active: currentData.data.is_active,
    }

    const updateResponse = await updatePilot(pilotId, updateData, cookie)

    if (!updateResponse.success) {
      console.error('❌ Update failed:', updateResponse.error)
      return
    }

    console.log('✅ Update API call succeeded')
    console.log('Returned rank:', updateResponse.data.role)

    // Step 5: Verify immediately
    console.log('\n📝 Step 5: Verifying update immediately...')
    const verifyData1 = await getPilot(pilotId, cookie)
    console.log('Rank after update:', verifyData1.data.role)

    if (verifyData1.data.role === newRank) {
      console.log('✅ PASS: Rank updated correctly')
    } else {
      console.log(`❌ FAIL: Rank is "${verifyData1.data.role}", expected "${newRank}"`)
    }

    // Step 6: Wait and verify again
    console.log('\n📝 Step 6: Waiting 2 seconds and verifying again...')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const verifyData2 = await getPilot(pilotId, cookie)
    console.log('Rank after 2 seconds:', verifyData2.data.role)

    if (verifyData2.data.role === newRank) {
      console.log('✅ PASS: Rank still correct after delay')
    } else {
      console.log(`❌ FAIL: Rank reverted to "${verifyData2.data.role}", expected "${newRank}"`)
    }

    // Step 7: Restore original rank
    console.log(`\n📝 Step 7: Restoring original rank to "${originalRank}"...`)
    updateData.role = originalRank
    const restoreResponse = await updatePilot(pilotId, updateData, cookie)

    if (restoreResponse.success) {
      console.log('✅ Original rank restored')
    } else {
      console.log('⚠️  Failed to restore original rank')
    }

    console.log('\n' + '='.repeat(80))
    console.log('🧪 TEST COMPLETE\n')
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
  }
}

testRankUpdate()
