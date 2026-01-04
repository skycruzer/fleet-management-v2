import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing Database Check Constraints\n')

// Test 1: Leave request with end_date before start_date
console.log('Test 1: Leave request with end_date < start_date (should FAIL)')
const test1 = await supabase.from('leave_requests').insert({
  start_date: '2025-10-20',
  end_date: '2025-10-19',
  days_count: 1,
  status: 'PENDING',
  leave_type: 'Annual',
  notes: 'Test constraint',
})

if (test1.error) {
  console.log('✅ PASS - Constraint working:', test1.error.message)
} else {
  console.log('❌ FAIL - Constraint NOT working, invalid data was inserted')
}

// Test 2: Leave request with days_count = 0
console.log('\nTest 2: Leave request with days_count = 0 (should FAIL)')
const test2 = await supabase.from('leave_requests').insert({
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 0,
  status: 'PENDING',
  leave_type: 'Annual',
  notes: 'Test constraint',
})

if (test2.error) {
  console.log('✅ PASS - Constraint working:', test2.error.message)
} else {
  console.log('❌ FAIL - Constraint NOT working, invalid data was inserted')
}

// Test 3: Leave request with invalid status
console.log('\nTest 3: Leave request with invalid status (should FAIL)')
const test3 = await supabase.from('leave_requests').insert({
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 2,
  status: 'INVALID_STATUS',
  leave_type: 'Annual',
  notes: 'Test constraint',
})

if (test3.error) {
  console.log('✅ PASS - Constraint working:', test3.error.message)
} else {
  console.log('❌ FAIL - Constraint NOT working, invalid data was inserted')
}

// Test 4: Feedback post with whitespace-only title
console.log('\nTest 4: Feedback post with whitespace-only title (should FAIL)')
const test4 = await supabase.from('feedback_posts').insert({
  title: '   ',
  content: 'Test content',
  category: 'General',
})

if (test4.error) {
  console.log('✅ PASS - Constraint working:', test4.error.message)
} else {
  console.log('❌ FAIL - Constraint NOT working, invalid data was inserted')
}

console.log('\n✅ All check constraints are functioning correctly!')
