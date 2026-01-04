/**
 * Test the actual API endpoint that the UI calls
 * This simulates the exact request from the Leave Reports form
 */

const API_URL = 'http://localhost:3001/api/reports/preview'

// Simulate the exact payload from the form
const payload = {
  reportType: 'leave-requests',
  filters: {
    timeFilterType: 'rosterPeriods',
    rosterPeriods: ['RP01/2026', 'RP13/2025', 'RP12/2025'],
    status: ['PENDING', 'APPROVED', 'REJECTED'],
    rank: ['Captain', 'First Officer'],
    submissionMethod: ['EMAIL', 'ORACLE', 'SYSTEM'],
  },
}

console.log('🧪 Testing Live API Endpoint\n')
console.log('📡 Endpoint:', API_URL)
console.log('📦 Payload:', JSON.stringify(payload, null, 2))
console.log('\n⏳ Sending request...\n')

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log(`📊 Response Status: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Error Response:', errorText)
    process.exit(1)
  }

  const data = await response.json()

  console.log('\n✅ Response Received!\n')
  console.log('📋 Summary:')
  console.log(`  Success: ${data.success}`)
  console.log(`  Total Records: ${data.data?.data?.length || 0}`)
  console.log(`  Report Title: ${data.data?.title}`)

  if (data.data?.summary) {
    console.log('\n📊 Summary Statistics:')
    console.log(`  Total Requests: ${data.data.summary.totalRequests}`)
    console.log(`  Pending: ${data.data.summary.pending}`)
    console.log(`  Approved: ${data.data.summary.approved}`)
    console.log(`  Rejected: ${data.data.summary.rejected}`)
    console.log(`  Captain Requests: ${data.data.summary.captainRequests}`)
    console.log(`  First Officer Requests: ${data.data.summary.firstOfficerRequests}`)
  }

  if (data.data?.data && data.data.data.length > 0) {
    console.log('\n📋 Sample Records (first 3):\n')
    data.data.data.slice(0, 3).forEach((record, idx) => {
      console.log(
        `${idx + 1}. ${record.pilot?.first_name} ${record.pilot?.last_name} (${record.pilot?.role})`
      )
      console.log(`   Status: ${record.status}`)
      console.log(`   Type: ${record.request_type}`)
      console.log(`   Roster Period: ${record.roster_period}`)
      console.log(`   Dates: ${record.start_date} to ${record.end_date}`)
      console.log('')
    })
  }

  console.log('✅ API Test Complete!')

  // Determine if test passed
  const passed =
    data.success &&
    data.data?.summary?.totalRequests > 0 &&
    (data.data?.summary?.pending > 0 || data.data?.summary?.approved > 0)

  console.log(`\n${passed ? '✅ TEST PASSED' : '❌ TEST FAILED'}`)
  process.exit(passed ? 0 : 1)
} catch (error) {
  console.error('❌ Request Failed:', error.message)
  process.exit(1)
}
