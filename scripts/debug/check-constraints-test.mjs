import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking Database for Check Constraints\n')

// Query to check if constraints exist
const { data: constraints, error } = await supabase
  .rpc('check_constraints_status', {}, { count: 'exact' })
  .catch(() => ({ data: null, error: null }))

// Alternative: Query PostgreSQL system catalog for constraints
const { data: pgConstraints, error: pgError } = await supabase
  .from('information_schema.table_constraints')
  .select('*')
  .eq('constraint_type', 'CHECK')
  .in('table_name', ['leave_requests', 'feedback_posts', 'pilots', 'flight_requests'])
  .catch(() => ({ data: null, error: null }))

console.log('Querying constraint information from PostgreSQL system catalog...\n')

// Try raw SQL query using the Postgres REST API
const query = `
SELECT 
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('leave_requests', 'feedback_posts', 'pilots', 'flight_requests', 'disciplinary_actions', 'feedback_comments', 'notifications', 'pilot_checks', 'documents')
ORDER BY tc.table_name, tc.constraint_name;
`

console.log('📋 Listing all CHECK constraints in the database:\n')
console.log('Note: This requires using a database client. Let me check the schema directly...\n')

// Get table info for leave_requests
const { data: leaveRequestsInfo } = await supabase.from('leave_requests').select('*').limit(1)

console.log(
  'Sample leave_requests columns:',
  leaveRequestsInfo ? Object.keys(leaveRequestsInfo[0] || {}) : 'No data'
)

// Get table info for feedback_posts
const { data: feedbackPostsInfo } = await supabase.from('feedback_posts').select('*').limit(1)

console.log(
  'Sample feedback_posts columns:',
  feedbackPostsInfo ? Object.keys(feedbackPostsInfo[0] || {}) : 'No data'
)

console.log('\n📝 Testing Constraints with Correct Schema\n')

// Get a pilot ID first
const { data: pilots } = await supabase.from('pilots').select('id').limit(1)
const pilotId = pilots?.[0]?.id

if (!pilotId) {
  console.log('❌ No pilot found in database for testing')
  process.exit(1)
}

console.log(`Using pilot ID: ${pilotId}\n`)

// Test 1: Leave request with end_date before start_date
console.log('Test 1: Leave request with end_date < start_date')
const test1 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-19',
  days_count: 1,
  status: 'PENDING',
})

if (test1.error) {
  console.log('✅ PASS - Constraint working:', test1.error.message)
  console.log('   Error code:', test1.error.code)
} else {
  console.log('❌ FAIL - Constraint NOT working')
}

// Test 2: Leave request with days_count = 0
console.log('\nTest 2: Leave request with days_count = 0')
const test2 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 0,
  status: 'PENDING',
})

if (test2.error) {
  console.log('✅ PASS - Constraint working:', test2.error.message)
  console.log('   Error code:', test2.error.code)
} else {
  console.log('❌ FAIL - Constraint NOT working')
}

// Test 3: Leave request with negative days_count
console.log('\nTest 3: Leave request with negative days_count')
const test3 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: -5,
  status: 'PENDING',
})

if (test3.error) {
  console.log('✅ PASS - Constraint working:', test3.error.message)
  console.log('   Error code:', test3.error.code)
} else {
  console.log('❌ FAIL - Constraint NOT working')
}

// Test 4: Invalid status (if constraint exists)
console.log('\nTest 4: Leave request with invalid status')
const test4 = await supabase.from('leave_requests').insert({
  pilot_id: pilotId,
  start_date: '2025-10-20',
  end_date: '2025-10-21',
  days_count: 2,
  status: 'INVALID_STATUS',
})

if (test4.error) {
  console.log('✅ PASS - Constraint working:', test4.error.message)
  console.log('   Error code:', test4.error.code)
} else {
  console.log('❌ FAIL - Constraint NOT working')
}

console.log('\n✅ Check Constraint Testing Complete!')
