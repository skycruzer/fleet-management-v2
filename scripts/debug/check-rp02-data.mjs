/**
 * Diagnostic Script: Check RP02/2026 Data
 *
 * Audits all pilot_requests for RP02/2026 to verify why widget shows zeros.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function checkRP02Data() {
  console.log('='.repeat(70))
  console.log('🔍 Diagnostic: RP02/2026 Data Audit')
  console.log('='.repeat(70))

  try {
    // Check if RP02/2026 exists in roster_periods
    console.log('\n📋 Step 1: Verify roster_periods table')
    const { data: rosterPeriod, error: rosterError } = await supabase
      .from('roster_periods')
      .select('*')
      .eq('code', 'RP02/2026')
      .single()

    if (rosterError || !rosterPeriod) {
      console.log('   ❌ RP02/2026 NOT FOUND in roster_periods table')
      console.log('   💡 This roster period may not have been created yet')
    } else {
      console.log('   ✅ RP02/2026 found in roster_periods:')
      console.log(`      Start Date: ${rosterPeriod.start_date}`)
      console.log(`      End Date: ${rosterPeriod.end_date}`)
      console.log(`      Deadline: ${rosterPeriod.request_deadline_date}`)
      console.log(`      Status: ${rosterPeriod.status}`)
    }

    // Check pilot_requests for RP02/2026
    console.log('\n📊 Step 2: Query pilot_requests for RP02/2026')
    const { data: requests, error: requestsError } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('roster_period', 'RP02/2026')

    if (requestsError) {
      console.log(`   ❌ Error querying pilot_requests: ${requestsError.message}`)
      return
    }

    if (!requests || requests.length === 0) {
      console.log('   ⚠️  NO REQUESTS FOUND for RP02/2026')
      console.log('   💡 Widget showing zeros is CORRECT - no data exists')
    } else {
      console.log(`   ✅ Found ${requests.length} requests for RP02/2026\n`)

      // Breakdown by category
      const byCategory = {}
      requests.forEach((req) => {
        byCategory[req.request_category] = (byCategory[req.request_category] || 0) + 1
      })

      console.log('   📊 Breakdown by Category:')
      Object.entries(byCategory).forEach(([cat, count]) => {
        console.log(`      ${cat}: ${count}`)
      })

      // Breakdown by request type
      const byType = {}
      requests.forEach((req) => {
        byType[req.request_type] = (byType[req.request_type] || 0) + 1
      })

      console.log('\n   📊 Breakdown by Request Type:')
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`)
      })

      // Breakdown by workflow status
      const byStatus = {}
      requests.forEach((req) => {
        byStatus[req.workflow_status] = (byStatus[req.workflow_status] || 0) + 1
      })

      console.log('\n   📊 Breakdown by Workflow Status:')
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`      ${status}: ${count}`)
      })

      // Breakdown by submission channel
      const byChannel = {}
      requests.forEach((req) => {
        byChannel[req.submission_channel] = (byChannel[req.submission_channel] || 0) + 1
      })

      console.log('\n   📊 Breakdown by Submission Channel:')
      Object.entries(byChannel).forEach(([channel, count]) => {
        console.log(`      ${channel}: ${count}`)
      })

      // Sample records
      console.log('\n   📝 Sample Records (first 3):')
      requests.slice(0, 3).forEach((req, idx) => {
        console.log(`\n      Record ${idx + 1}:`)
        console.log(`         Pilot: ${req.name} (${req.employee_number})`)
        console.log(`         Type: ${req.request_type}`)
        console.log(`         Category: ${req.request_category}`)
        console.log(`         Status: ${req.workflow_status}`)
        console.log(`         Dates: ${req.start_date} to ${req.end_date}`)
        console.log(`         Channel: ${req.submission_channel}`)
      })
    }

    // Check original leave_requests table for RP02/2026
    console.log('\n📥 Step 3: Check original leave_requests for RP02/2026')
    const { data: leaveReqs, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('roster_period', 'RP02/2026')

    if (leaveError) {
      console.log(`   ❌ Error querying leave_requests: ${leaveError.message}`)
    } else if (!leaveReqs || leaveReqs.length === 0) {
      console.log('   ℹ️  No records in original leave_requests for RP02/2026')
      console.log('   💡 No historical data exists for this period')
    } else {
      console.log(`   ✅ Found ${leaveReqs.length} original leave_requests for RP02/2026`)
      console.log('   ⚠️  These should have been migrated to pilot_requests!')
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Diagnostic Summary')
    console.log('='.repeat(70))

    if (!requests || requests.length === 0) {
      console.log('\n   🔍 FINDING: RP02/2026 widget showing zeros is CORRECT')
      console.log('   📌 REASON: No pilot_requests records exist for this roster period')
      console.log('   ✅ ACTION: No data issue - this is expected behavior')
    } else {
      console.log(`\n   ✅ Data exists: ${requests.length} requests found`)
      console.log('   ⚠️  Widget should be showing these counts')
      console.log('   🔍 Potential issue with widget query logic')
    }

    console.log('\n' + '='.repeat(70))
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error)
    console.error(error.stack)
  }
}

checkRP02Data().catch(console.error)
