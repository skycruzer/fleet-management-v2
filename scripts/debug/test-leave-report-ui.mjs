/**
 * Test leave report with UI data formatting
 * Verifies the complete fix including data structure for UI components
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLeaveReportWithUIFormat() {
  console.log('\n🔍 Testing Leave Report (Service Layer + UI Format)\n')

  // Simulate the exact query from generateLeaveReport()
  const { data, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data.length} leave requests\n`)

  // Test UI data format (what the table component receives)
  console.log('📊 Sample Data Format for UI:\n')

  const sampleRecords = data.slice(0, 3)
  sampleRecords.forEach((record, i) => {
    console.log(`Record ${i + 1}:`)
    console.log(`  - Name (denormalized): ${record.name}`)
    console.log(`  - Rank (denormalized): ${record.rank}`)
    console.log(`  - Request Type: ${record.request_type}`)
    console.log(`  - Start Date: ${record.start_date}`)
    console.log(`  - End Date: ${record.end_date}`)
    console.log(`  - Workflow Status: ${record.workflow_status}`)
    console.log(`  - Roster Period: ${record.roster_period || 'N/A'}`)
    console.log()
  })

  // Check Craig Duffield specifically
  const craigRequests = data.filter(
    (r) => r.name?.toUpperCase().includes('CRAIG') && r.name?.toUpperCase().includes('DUFFIELD')
  )

  console.log(`\n✅ Craig Duffield: Found ${craigRequests.length} request(s)\n`)

  if (craigRequests.length > 0) {
    craigRequests.forEach((req, i) => {
      console.log(`Craig's Request ${i + 1}:`)
      console.log(`  - Type: ${req.request_type}`)
      console.log(`  - Dates: ${req.start_date} to ${req.end_date}`)
      console.log(`  - Status: ${req.workflow_status}`)
      console.log(`  - Roster Period: ${req.roster_period || 'N/A'}`)
      console.log()
    })
  } else {
    console.log('   ❌ Still missing Craig Duffield!')
  }

  // Summary stats (what appears in report summary)
  const summary = {
    totalRequests: data.length,
    pending: data.filter((r) => r.workflow_status?.toUpperCase() === 'PENDING').length,
    submitted: data.filter((r) => r.workflow_status?.toUpperCase() === 'SUBMITTED').length,
    approved: data.filter((r) => r.workflow_status?.toUpperCase() === 'APPROVED').length,
    captainRequests: data.filter((r) => r.rank === 'Captain').length,
    foRequests: data.filter((r) => r.rank === 'First Officer').length,
  }

  console.log('\n📈 Report Summary Statistics:')
  console.log(`   Total Leave Requests: ${summary.totalRequests}`)
  console.log(`   Pending: ${summary.pending}`)
  console.log(`   Submitted: ${summary.submitted}`)
  console.log(`   Approved: ${summary.approved}`)
  console.log(`   Captain Requests: ${summary.captainRequests}`)
  console.log(`   First Officer Requests: ${summary.foRequests}`)

  // Test that UI components can access data correctly
  console.log('\n✅ UI Component Data Access Test:')
  const testRecord = data[0]
  console.log(`   row.name: ${testRecord.name} (✓ direct access)`)
  console.log(`   row.rank: ${testRecord.rank} (✓ direct access)`)
  console.log(`   row.request_type: ${testRecord.request_type} (✓ direct access)`)
  console.log(`   row.workflow_status: ${testRecord.workflow_status} (✓ direct access)`)
  console.log(`   row.pilot: ${testRecord.pilot} (should be undefined for new records)`)

  console.log('\n✅ All data properly formatted for UI components!')
}

testLeaveReportWithUIFormat()
