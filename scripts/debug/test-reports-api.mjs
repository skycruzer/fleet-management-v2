/**
 * Test Reports API Endpoints
 * Tests Preview, Export, and Email endpoints with authentication
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testReportsAPI() {
  console.log('🧪 Testing Reports API\n')

  // 1. Sign in to get auth token
  console.log('1️⃣ Authenticating...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@fleetmanagement.com', // Replace with your test credentials
    password: 'your-test-password',
  })

  if (authError) {
    console.error('❌ Authentication failed:', authError.message)
    console.log('\n⚠️  Update email/password in test-reports-api.mjs with valid credentials')
    return
  }

  const accessToken = authData.session.access_token
  console.log('✅ Authenticated as:', authData.user.email)

  // 2. Test Preview API with filters
  console.log('\n2️⃣ Testing Preview API (Leave Requests Report)...')
  const previewResponse = await fetch('http://localhost:3001/api/reports/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reportType: 'leave',
      filters: {
        status: ['pending', 'approved'],
        rank: ['Captain', 'First Officer'],
      },
    }),
  })

  const previewResult = await previewResponse.json()

  if (previewResult.success) {
    console.log('✅ Preview API works!')
    console.log(`   📊 Total records: ${previewResult.report.data.length}`)
    console.log(`   📈 Summary:`, previewResult.report.summary)
    if (previewResult.report.pagination) {
      console.log(
        `   📄 Pagination: Page ${previewResult.report.pagination.currentPage} of ${previewResult.report.pagination.totalPages}`
      )
    }
  } else {
    console.error('❌ Preview failed:', previewResult.error)
    if (previewResult.details) {
      console.error('   Validation errors:', previewResult.details)
    }
  }

  // 3. Test Export API
  console.log('\n3️⃣ Testing Export PDF API...')
  const exportResponse = await fetch('http://localhost:3001/api/reports/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reportType: 'leave',
      filters: {
        status: ['approved'],
        rank: ['Captain'],
      },
    }),
  })

  if (exportResponse.ok) {
    const pdfBuffer = await exportResponse.arrayBuffer()
    console.log('✅ Export PDF API works!')
    console.log(`   📄 PDF size: ${(pdfBuffer.byteLength / 1024).toFixed(2)} KB`)
  } else {
    const exportError = await exportResponse.json()
    console.error('❌ Export failed:', exportError.error)
  }

  // 4. Test different report types
  console.log('\n4️⃣ Testing Flight Requests Report...')
  const flightResponse = await fetch('http://localhost:3001/api/reports/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reportType: 'flight-requests',
      filters: {
        status: ['pending', 'approved'],
      },
    }),
  })

  const flightResult = await flightResponse.json()
  if (flightResult.success) {
    console.log('✅ Flight Requests Report works!')
    console.log(`   📊 Total records: ${flightResult.report.data.length}`)
  } else {
    console.error('❌ Flight Requests failed:', flightResult.error)
  }

  console.log('\n5️⃣ Testing Certifications Report...')
  const certResponse = await fetch('http://localhost:3001/api/reports/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      reportType: 'certifications',
      filters: {
        expiryThreshold: 90,
        rank: ['Captain', 'First Officer'],
      },
    }),
  })

  const certResult = await certResponse.json()
  if (certResult.success) {
    console.log('✅ Certifications Report works!')
    console.log(`   📊 Total records: ${certResult.report.data.length}`)
    console.log(`   📈 Summary:`, certResult.report.summary)
  } else {
    console.error('❌ Certifications failed:', certResult.error)
  }

  console.log('\n✅ All tests completed!')
  console.log('\n📝 Manual Testing Instructions:')
  console.log('   1. Open http://localhost:3001 in your browser')
  console.log('   2. Sign in with admin credentials')
  console.log('   3. Navigate to Reports page (/dashboard/reports)')
  console.log('   4. Select filters (must select at least status or rank)')
  console.log('   5. Click "Preview" button')
  console.log('   6. Verify data appears in dialog')
  console.log('   7. Test "Export PDF" and "Email Report" buttons')

  await supabase.auth.signOut()
}

testReportsAPI().catch(console.error)
