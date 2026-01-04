#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Debugging Flight Request Submission\n')

const flightDate = new Date()
flightDate.setDate(flightDate.getDate() + 14)

const testData = {
  pilot_id: '1df41aae-b556-4563-b5b2-43d92c47b5fa',
  request_type: 'ADDITIONAL_FLIGHT',
  request_date: flightDate.toISOString().split('T')[0],
  description: 'Test flight request - additional sector',
  reason: 'Testing workflow',
  status: 'PENDING',
}

console.log('Attempting to insert:', testData)

const { data, error } = await supabase.from('flight_requests').insert(testData).select()

console.log('\nResult:')
console.log('Data:', data)
console.log('Error:', error)
