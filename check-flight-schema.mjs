#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Checking flight_requests table schema\n')

// Try to get any existing flight request to see the columns
const { data, error } = await supabase
  .from('flight_requests')
  .select('*')
  .limit(1)

console.log('Data:', data)
console.log('Error:', error)

if (data && data.length > 0) {
  console.log('\nColumns:', Object.keys(data[0]))
}
