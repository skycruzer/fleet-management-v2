#!/usr/bin/env node

/**
 * Performance Baseline Testing Script
 * Tests critical API endpoints and records response times
 * Run after migrations to establish performance baselines
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Measure query execution time
 */
async function measureQuery(name, queryFn) {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = Math.round(performance.now() - start)

    if (result.error) {
      console.log(`❌ ${name}: ${result.error.message}`)
      return { name, duration, status: 'error', error: result.error.message }
    }

    console.log(`✅ ${name}: ${duration}ms (${result.data?.length || 0} records)`)
    return { name, duration, status: 'success', recordCount: result.data?.length || 0 }
  } catch (error) {
    const duration = Math.round(performance.now() - start)
    console.log(`❌ ${name}: ${error.message}`)
    return { name, duration, status: 'error', error: error.message }
  }
}

console.log('🔍 Fleet Management V2 - Performance Baseline Testing')
console.log('=========================================================\n')

const results = []

// Test 1: Pilots Count (Simple aggregation)
console.log('📊 Test 1: Pilots Count Query')
results.push(
  await measureQuery('Pilots Count', async () => {
    return await supabase.from('pilots').select('id', { count: 'exact', head: true })
  })
)

// Test 2: Pilots List (Simple SELECT with indexes)
console.log('\n👥 Test 2: Pilots List Query')
results.push(
  await measureQuery('Pilots List', async () => {
    return await supabase
      .from('pilots')
      .select('id, first_name, last_name, employee_id, role, is_active, seniority_number')
      .order('seniority_number', { ascending: true })
  })
)

// Test 3: Pilot Checks with Expiry (Index on expiry_date)
console.log('\n📋 Test 3: Pilot Checks with Expiry')
results.push(
  await measureQuery('Pilot Checks (All)', async () => {
    return await supabase
      .from('pilot_checks')
      .select('id, pilot_id, check_type_id, expiry_date, created_at')
      .order('expiry_date', { ascending: true })
  })
)

// Test 4: Expiring Certifications (View + complex logic)
console.log('\n⚠️  Test 4: Expiring Certifications Query')
results.push(
  await measureQuery('Expiring Certifications', async () => {
    return await supabase
      .from('detailed_expiring_checks')
      .select('*')
      .order('expiry_date', { ascending: true })
      .limit(50)
  })
)

// Test 5: Leave Requests (Date range queries)
console.log('\n🏖️  Test 5: Leave Requests Query')
results.push(
  await measureQuery('Leave Requests', async () => {
    return await supabase
      .from('leave_requests')
      .select('id, pilot_id, start_date, end_date, status, request_type')
      .order('start_date', { ascending: false })
      .limit(100)
  })
)

// Test 6: Active Pilots Only (Partial index test)
console.log('\n✨ Test 6: Active Pilots Query (Index Test)')
results.push(
  await measureQuery('Active Pilots', async () => {
    return await supabase
      .from('pilots')
      .select('id, first_name, last_name, role, is_active')
      .eq('is_active', true)
      .order('seniority_number')
  })
)

// Test 7: Certification Types (Check Types table)
console.log('\n📑 Test 7: Check Types Query')
results.push(
  await measureQuery('Check Types', async () => {
    return await supabase.from('check_types').select('*').order('check_code')
  })
)

// Test 8: Compliance Dashboard (Complex view)
console.log('\n📈 Test 8: Compliance Dashboard View')
results.push(
  await measureQuery('Compliance Dashboard', async () => {
    return await supabase.from('compliance_dashboard').select('*').limit(10)
  })
)

// Summary
console.log('\n=========================================================')
console.log('📊 Performance Baseline Summary\n')

const successful = results.filter((r) => r.status === 'success')
const failed = results.filter((r) => r.status === 'error')

console.log(`✅ Successful: ${successful.length}/${results.length}`)
console.log(`❌ Failed: ${failed.length}/${results.length}\n`)

if (successful.length > 0) {
  console.log('Response Times:')
  successful.forEach((r) => {
    const emoji = r.duration < 200 ? '🟢' : r.duration < 500 ? '🟡' : '🔴'
    console.log(`  ${emoji} ${r.name}: ${r.duration}ms`)
  })
}

if (failed.length > 0) {
  console.log('\n❌ Failed Queries:')
  failed.forEach((r) => {
    console.log(`  • ${r.name}: ${r.error}`)
  })
}

// Performance Assessment
console.log('\n=========================================================')
console.log('🎯 Performance Assessment\n')

const avgTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
console.log(`Average Response Time: ${Math.round(avgTime)}ms`)

if (avgTime < 300) {
  console.log('✅ EXCELLENT: All queries performing under 300ms average')
} else if (avgTime < 500) {
  console.log('🟡 GOOD: Queries performing under 500ms average')
} else {
  console.log('⚠️  WARNING: Some queries may need optimization')
}

console.log('\n📝 Record these baselines in PRODUCTION-MONITORING-PLAN.md')
console.log('=========================================================\n')

process.exit(failed.length > 0 ? 1 : 0)
