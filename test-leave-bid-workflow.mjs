#!/usr/bin/env node

/**
 * Leave Bid Workflow Test - Pilot Portal + Admin Dashboard
 * Tests leave bid submission and admin review workflow
 *
 * Author: Maurice Rondeau
 * Date: November 1, 2025
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('\n🧪 LEAVE BID WORKFLOW TEST - PILOT PORTAL + ADMIN DASHBOARD\n')
console.log('='.repeat(70))

const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (details) console.log(`   ${details}`)

  results.tests.push({ name, passed, details })
  if (passed) results.passed++
  else results.failed++
}

// TEST 1: Verify test pilot
console.log('\n👤 TEST 1: Verify Test Pilot\n')

let testPilotId = null

try {
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('id, pilot_id, email')
    .eq('email', 'mrondeau@airniugini.com.pg')
    .single()

  if (pilotUser) {
    testPilotId = pilotUser.pilot_id
    logTest('Test pilot exists', true, `Pilot ID: ${testPilotId}`)
  } else {
    logTest('Test pilot exists', false, 'Maurice Rondeau not found')
    process.exit(1)
  }
} catch (error) {
  logTest('Test pilot lookup', false, error.message)
  process.exit(1)
}

// TEST 2: Check leave_bids table schema
console.log('\n📊 TEST 2: Verify Leave Bids Table Schema\n')

try {
  const { data: schema, error } = await supabase
    .from('leave_bids')
    .select('*')
    .limit(1)

  if (error && error.message.includes('does not exist')) {
    logTest('Leave bids table exists', false, 'Table does not exist in database')
  } else {
    logTest('Leave bids table exists', true, 'Table found')
  }
} catch (error) {
  logTest('Schema check', false, error.message)
}

// TEST 3: Submit leave bid
console.log('\n📝 TEST 3: Submit Leave Bid\n')

let leaveBidId = null

try {
  // Submit leave bid
  const { data: leaveBid, error } = await supabase
    .from('leave_bids')
    .insert({
      pilot_id: testPilotId,
      roster_period_code: 'RP13/2025',
      preferred_dates: JSON.stringify([
        { start: '2025-12-01', end: '2025-12-14' }
      ]),
      priority: 'HIGH',
      reason: 'Annual leave for family vacation - testing leave bid workflow',
      status: 'PENDING',
    })
    .select()
    .single()

  if (error) {
    logTest('Leave bid submission', false, error.message)
  } else if (leaveBid) {
    leaveBidId = leaveBid.id
    logTest('Leave bid submission', true, `ID: ${leaveBidId}`)
  }
} catch (error) {
  logTest('Leave bid submission', false, error.message)
}

// TEST 4: Verify admin can view leave bid
console.log('\n👔 TEST 4: Admin Dashboard Visibility\n')

if (leaveBidId) {
  try {
    const { data: adminView } = await supabase
      .from('leave_bids')
      .select('id, status, priority')
      .eq('id', leaveBidId)
      .single()

    logTest('Leave bid visible to admin', !!adminView, adminView ? `Status: ${adminView.status}, Priority: ${adminView.priority}` : 'Not visible')
  } catch (error) {
    logTest('Admin visibility check', false, error.message)
  }
}

// CLEANUP
console.log('\n🧹 Cleanup\n')

try {
  if (leaveBidId) {
    await supabase.from('leave_bids').delete().eq('id', leaveBidId)
    console.log('✅ Test data deleted')
  }
} catch (error) {
  console.log('⚠️  Cleanup warning:', error.message)
}

// REPORT
console.log('\n' + '='.repeat(70))
console.log('\n📊 TEST RESULTS\n')
console.log(`Total: ${results.passed + results.failed}`)
console.log(`✅ Passed: ${results.passed}`)
console.log(`❌ Failed: ${results.failed}\n`)

console.log(results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED')
console.log('\n' + '='.repeat(70) + '\n')

process.exit(results.failed > 0 ? 1 : 0)
