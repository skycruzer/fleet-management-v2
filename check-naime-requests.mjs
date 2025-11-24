import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking for Naime Aihi leave requests...\n')

// 1. Find pilot
const { data: pilot, error: pilotError } = await supabase
  .from('pilots')
  .select('*')
  .or('first_name.ilike.%naime%,last_name.ilike.%aihi%')
  .single()

if (pilotError) {
  console.error('❌ Pilot not found:', pilotError.message)
  process.exit(1)
}

console.log('✅ Found pilot:')
console.log(`   Name: ${pilot.first_name} ${pilot.last_name}`)
console.log(`   ID: ${pilot.id}`)
console.log(`   Employee ID: ${pilot.employee_id}\n`)

// 2. Check unified pilot_requests table
const { data: requests, error: requestsError } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('pilot_id', pilot.id)
  .eq('request_category', 'LEAVE')
  .order('created_at', { ascending: false })

console.log('📋 Leave requests in pilot_requests table:')
if (requests && requests.length > 0) {
  requests.forEach((req, i) => {
    console.log(`\n   ${i + 1}. ${req.leave_type || 'UNKNOWN TYPE'}`)
    console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
    console.log(`      Status: ${req.workflow_status}`)
    console.log(`      Created: ${req.created_at}`)
  })
} else {
  console.log('   ❌ No leave requests found in pilot_requests')
}

// 3. Check legacy leave_requests table
const { data: legacyRequests, error: legacyError } = await supabase
  .from('leave_requests')
  .select('*')
  .eq('pilot_id', pilot.id)
  .order('created_at', { ascending: false })

console.log('\n\n📚 Leave requests in legacy leave_requests table:')
if (legacyRequests && legacyRequests.length > 0) {
  legacyRequests.forEach((req, i) => {
    console.log(`\n   ${i + 1}. ${req.leave_type}`)
    console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
    console.log(`      Status: ${req.workflow_status}`)
    console.log(`      Created: ${req.created_at}`)
  })
} else {
  console.log('   ❌ No leave requests found in legacy table')
}

console.log('\n\n📊 Summary:')
console.log(`   pilot_requests: ${requests?.length || 0} leave requests`)
console.log(`   leave_requests (legacy): ${legacyRequests?.length || 0} requests`)
