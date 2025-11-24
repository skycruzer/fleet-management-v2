#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Verifying flight_requests constraint status\n')

// Test if we can insert with ADDITIONAL_FLIGHT
const testPilotId = '1df41aae-b556-4563-b5b2-43d92c47b5fa'
const flightDate = new Date()
flightDate.setDate(flightDate.getDate() + 14)

const { data, error } = await supabase
  .from('flight_requests')
  .insert({
    pilot_id: testPilotId,
    request_type: 'ADDITIONAL_FLIGHT',
    flight_date: flightDate.toISOString().split('T')[0],
    description: 'Test flight request - verifying constraint removed',
    reason: 'Testing after SQL fix',
    status: 'PENDING',
  })
  .select()
  .single()

if (error) {
  console.log('❌ CONSTRAINT STILL EXISTS')
  console.log('Error:', error.message)
  console.log('\nThe constraint needs to be removed in Supabase SQL Editor.')
} else {
  console.log('✅ CONSTRAINT REMOVED SUCCESSFULLY')
  console.log('Flight request created:', data.id)
  
  // Clean up test data
  await supabase.from('flight_requests').delete().eq('id', data.id)
  console.log('Test data cleaned up')
}
