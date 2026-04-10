import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing Database Check Constraints\n')
console.log('='.repeat(80))

// Get a pilot ID for testing
const { data: pilots } = await supabase.from('pilots').select('id').limit(1)
const pilotId = pilots?.[0]?.id

if (!pilotId) {
  console.log('❌ No pilot found in database for testing')
  process.exit(1)
}

console.log(`\n✓ Using pilot ID: ${pilotId}\n`)

let passCount = 0
let failCount = 0

// Test 1: Leave request with end_date before start_date
console.log('Test 1: Leave request with end_date < start_date (SHOULD FAIL)')
console.log('-'.repeat(80))
const test1 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-19',
  days_count: 1,
  status: 'PENDING',
})

if (test1.error) {
  console.log('✅ PASS - Constraint "leave_requests_dates_valid" is working')
  console.log(`   Error: ${test1.error.message}`)
  passCount++
} else {
  console.log('❌ FAIL - Invalid data was inserted! Constraint is missing.')
  failCount++
}

console.log()

// Test 2: Leave request with days_count = 0
console.log('Test 2: Leave request with days_count = 0 (SHOULD FAIL)')
console.log('-'.repeat(80))
const test2 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 0,
  status: 'PENDING',
})

if (test2.error) {
  console.log('✅ PASS - Constraint "leave_requests_days_positive" is working')
  console.log(`   Error: ${test2.error.message}`)
  passCount++
} else {
  console.log('❌ FAIL - Invalid data was inserted! Constraint is missing.')
  failCount++
}

console.log()

// Test 3: Leave request with negative days_count
console.log('Test 3: Leave request with negative days_count (SHOULD FAIL)')
console.log('-'.repeat(80))
const test3 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: -5,
  status: 'PENDING',
})

if (test3.error) {
  console.log('✅ PASS - Constraint "leave_requests_days_positive" is working')
  console.log(`   Error: ${test3.error.message}`)
  passCount++
} else {
  console.log('❌ FAIL - Invalid data was inserted! Constraint is missing.')
  failCount++
}

console.log()

// Test 4: Invalid status
console.log('Test 4: Leave request with invalid status "INVALID_STATUS" (SHOULD FAIL)')
console.log('-'.repeat(80))
const test4 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 2,
  status: 'INVALID_STATUS',
})

if (test4.error) {
  console.log('✅ PASS - Status enum constraint is working')
  console.log(`   Error: ${test4.error.message}`)
  passCount++
} else {
  console.log('❌ FAIL - Invalid data was inserted! Constraint is missing.')
  failCount++
}

console.log()
console.log('='.repeat(80))
console.log('\n📊 Test Summary')
console.log('='.repeat(80))
console.log(`✅ Passed: ${passCount}`)
console.log(`❌ Failed: ${failCount}`)
console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`)

if (failCount === 0) {
  console.log('\n🎉 All check constraints are working correctly!')
} else {
  console.log('\n⚠️  Some constraints are missing. Migration may need to be deployed.')
}
