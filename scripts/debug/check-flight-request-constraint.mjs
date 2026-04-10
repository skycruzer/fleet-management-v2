#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Checking flight_requests table constraints\n')

// Get table definition
const { data, error } = await supabase.from('flight_requests').select('request_type').limit(5)

console.log(
  'Sample request_type values:',
  data?.map((r) => r.request_type)
)
console.log('Error:', error)
