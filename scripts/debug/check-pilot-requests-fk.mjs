import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('=== Checking pilot_requests Foreign Keys ===\n')

// Test the relationship query with different syntaxes
console.log('Test 1: Using pilots!employee_number syntax')
const { data: test1, error: error1 } = await supabase
  .from('pilot_requests')
  .select(`
    id,
    employee_number,
    start_date,
    end_date,
    request_category,
    pilot:pilots!employee_number (
      first_name,
      last_name,
      role
    )
  `)
  .eq('request_category', 'LEAVE')
  .limit(1)

if (error1) {
  console.log('❌ Error:', error1.message)
} else {
  console.log('✅ Success! Sample data:')
  console.log(JSON.stringify(test1, null, 2))
}

console.log('\n---\n')

console.log('Test 2: Using pilots!pilot_requests_employee_number_fkey syntax')
const { data: test2, error: error2 } = await supabase
  .from('pilot_requests')
  .select(`
    id,
    employee_number,
    start_date,
    end_date,
    request_category,
    pilot:pilots!pilot_requests_employee_number_fkey (
      first_name,
      last_name,
      role
    )
  `)
  .eq('request_category', 'LEAVE')
  .limit(1)

if (error2) {
  console.log('❌ Error:', error2.message)
} else {
  console.log('✅ Success! Sample data:')
  console.log(JSON.stringify(test2, null, 2))
}

console.log('\n---\n')

console.log('Test 3: Using pilots(employee_number) inner join syntax')
const { data: test3, error: error3 } = await supabase
  .from('pilot_requests')
  .select(`
    id,
    employee_number,
    start_date,
    end_date,
    request_category,
    pilots(first_name, last_name, role)
  `)
  .eq('request_category', 'LEAVE')
  .limit(1)

if (error3) {
  console.log('❌ Error:', error3.message)
} else {
  console.log('✅ Success! Sample data:')
  console.log(JSON.stringify(test3, null, 2))
}

console.log('\n---\n')

// Check if there are any pilot_requests records
const { count } = await supabase
  .from('pilot_requests')
  .select('*', { count: 'exact', head: true })

console.log(`Total pilot_requests records: ${count}`)

// Get a sample record to see the structure
const { data: sample, error: sampleError } = await supabase
  .from('pilot_requests')
  .select('*')
  .limit(1)

if (sampleError) {
  console.log('Error fetching sample:', sampleError.message)
} else if (sample && sample.length > 0) {
  console.log('\nSample pilot_requests record:')
  console.log(JSON.stringify(sample[0], null, 2))
} else {
  console.log('\nNo records found in pilot_requests table')
}
