#!/usr/bin/env node

/**
 * Smoke Test Suite for Database Constraints
 * Tests that all deployed constraints are actively enforcing data integrity
 * These tests SHOULD FAIL - that's how we know constraints are working!
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

let testsPassed = 0
let testsFailed = 0

/**
 * Run a constraint test - we EXPECT it to fail
 * If it fails with a constraint error, the test passes
 * If it succeeds, the constraint is not working!
 */
async function testConstraint(name, testFn, expectedError) {
  try {
    const result = await testFn()

    if (result.error) {
      // Check if error matches expected constraint violation
      const errorMsg = result.error.message.toLowerCase()
      const isExpectedError =
        errorMsg.includes('constraint') ||
        errorMsg.includes('violates') ||
        errorMsg.includes('duplicate') ||
        errorMsg.includes('unique') ||
        errorMsg.includes('check') ||
        errorMsg.includes('not null') ||
        (expectedError && errorMsg.includes(expectedError.toLowerCase()))

      if (isExpectedError) {
        console.log(`✅ PASS: ${name}`)
        console.log(
          `   └─ Constraint correctly blocked: ${result.error.message.substring(0, 80)}...`
        )
        testsPassed++
        return true
      } else {
        console.log(`❌ FAIL: ${name}`)
        console.log(`   └─ Unexpected error: ${result.error.message}`)
        testsFailed++
        return false
      }
    } else {
      console.log(`❌ FAIL: ${name}`)
      console.log(`   └─ Constraint did not block invalid data! This is a problem.`)
      testsFailed++
      return false
    }
  } catch (error) {
    console.log(`⚠️  ERROR: ${name}`)
    console.log(`   └─ Test error: ${error.message}`)
    testsFailed++
    return false
  }
}

console.log('🧪 Fleet Management V2 - Constraint Smoke Tests')
console.log('==================================================\n')
console.log('NOTE: These tests SHOULD FAIL - that proves constraints are working!\n')

// =============================================================================
// NOT NULL Constraint Tests
// =============================================================================

console.log('📋 Test Category 1: NOT NULL Constraints\n')

await testConstraint(
  'NOT NULL: Pilot first_name required',
  async () => {
    return await supabase.from('pilots').insert({
      employee_id: 'TEST-NULL-001',
      last_name: 'Test',
      role: 'First Officer',
      // first_name is missing (should fail)
    })
  },
  'not null'
)

await testConstraint(
  'NOT NULL: Pilot employee_id required',
  async () => {
    return await supabase.from('pilots').insert({
      first_name: 'Test',
      last_name: 'Pilot',
      role: 'Captain',
      // employee_id is missing (should fail)
    })
  },
  'not null'
)

// =============================================================================
// UNIQUE Constraint Tests
// =============================================================================

console.log('\n📋 Test Category 2: UNIQUE Constraints\n')

// First, get an existing employee_id
const { data: existingPilot } = await supabase
  .from('pilots')
  .select('employee_id')
  .limit(1)
  .single()

if (existingPilot) {
  await testConstraint(
    'UNIQUE: Duplicate employee_id blocked',
    async () => {
      return await supabase.from('pilots').insert({
        employee_id: existingPilot.employee_id, // Duplicate!
        first_name: 'Duplicate',
        last_name: 'Test',
        role: 'First Officer',
      })
    },
    'unique'
  )
}

// =============================================================================
// CHECK Constraint Tests
// =============================================================================

console.log('\n📋 Test Category 3: CHECK Constraints\n')

await testConstraint(
  'CHECK: Seniority number must be between 1-1000',
  async () => {
    return await supabase.from('pilots').insert({
      employee_id: 'TEST-CHECK-001',
      first_name: 'Test',
      last_name: 'Pilot',
      role: 'Captain',
      seniority_number: 9999, // Invalid: > 1000
    })
  },
  'check'
)

await testConstraint(
  'CHECK: Leave request end_date >= start_date',
  async () => {
    // Get a pilot ID
    const { data: pilot } = await supabase.from('pilots').select('id').limit(1).single()

    if (!pilot) {
      console.log('⚠️  SKIP: No pilots found for leave request test')
      return { error: null }
    }

    return await supabase.from('leave_requests').insert({
      pilot_id: pilot.id,
      start_date: '2025-12-31',
      end_date: '2025-01-01', // Invalid: end before start
      days_count: 1,
      status: 'pending',
    })
  },
  'check'
)

await testConstraint(
  'CHECK: Roster period format validation',
  async () => {
    return await supabase.from('roster_period_capacity').insert({
      roster_period: 'INVALID-FORMAT', // Should be RP1/2025 format
      capacity: 10,
    })
  },
  'check'
)

await testConstraint(
  'CHECK: Feedback category display_order must be >= 1',
  async () => {
    return await supabase.from('feedback_categories').insert({
      name: 'Test Category',
      display_order: 0, // Invalid: must be >= 1
    })
  },
  'check'
)

await testConstraint(
  'CHECK: Disciplinary severity must be valid enum',
  async () => {
    // Get a pilot ID
    const { data: pilot } = await supabase.from('pilots').select('id').limit(1).single()

    if (!pilot) {
      console.log('⚠️  SKIP: No pilots found for disciplinary test')
      return { error: null }
    }

    return await supabase.from('disciplinary_matters').insert({
      pilot_id: pilot.id,
      incident_date: '2025-10-27',
      description: 'Test',
      severity: 'super-critical', // Invalid: not in enum
      status: 'open',
    })
  },
  'check'
)

// =============================================================================
// Foreign Key Constraint Tests
// =============================================================================

console.log('\n📋 Test Category 4: Foreign Key Constraints\n')

await testConstraint(
  'FOREIGN KEY: Pilot check must reference valid pilot',
  async () => {
    // Get a valid check type
    const { data: checkType } = await supabase.from('check_types').select('id').limit(1).single()

    if (!checkType) {
      console.log('⚠️  SKIP: No check types found')
      return { error: null }
    }

    return await supabase.from('pilot_checks').insert({
      pilot_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      check_type_id: checkType.id,
      expiry_date: '2026-12-31',
    })
  },
  'foreign key'
)

await testConstraint(
  'FOREIGN KEY: Pilot check must reference valid check type',
  async () => {
    // Get a valid pilot
    const { data: pilot } = await supabase.from('pilots').select('id').limit(1).single()

    if (!pilot) {
      console.log('⚠️  SKIP: No pilots found')
      return { error: null }
    }

    return await supabase.from('pilot_checks').insert({
      pilot_id: pilot.id,
      check_type_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      expiry_date: '2026-12-31',
    })
  },
  'foreign key'
)

// =============================================================================
// Summary
// =============================================================================

console.log('\n==================================================')
console.log('📊 Smoke Test Results\n')

const totalTests = testsPassed + testsFailed
const successRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0

console.log(`Total Tests: ${totalTests}`)
console.log(`✅ Passed: ${testsPassed} (constraints working correctly)`)
console.log(`❌ Failed: ${testsFailed} (constraints NOT enforcing)`)
console.log(`Success Rate: ${successRate}%\n`)

if (successRate === 100) {
  console.log('🎉 EXCELLENT: All constraints are actively enforcing data integrity!')
  console.log('All tests correctly failed, proving constraints are working.\n')
} else if (successRate >= 80) {
  console.log('✅ GOOD: Most constraints are working, but some may need attention.\n')
} else {
  console.log('⚠️  WARNING: Multiple constraints are not enforcing properly!\n')
  console.log('Action Required: Review failed tests and check constraint deployment.\n')
}

console.log('==================================================\n')

// Exit with appropriate code
process.exit(testsFailed > totalTests * 0.2 ? 1 : 0)
