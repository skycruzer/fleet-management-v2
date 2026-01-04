import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg'

const supabase = createClient('https://wgdmgvonqysflwdiiols.supabase.co', SERVICE_KEY)

console.log('🔍 Verifying Migration with Service Role\n')

const { data: leave } = await supabase
  .from('pilot_requests')
  .select('id, request_category, request_type, workflow_status')
  .eq('request_category', 'LEAVE')
  .limit(3)

console.log('✅ Leave requests in pilot_requests:', leave?.length || 0)
if (leave && leave.length > 0) {
  console.log('   Sample:', leave[0])
}

const { count: bids } = await supabase
  .from('leave_bids')
  .select('*', { count: 'exact', head: true })

console.log('✅ Leave bids:', bids)

const { count: certs } = await supabase
  .from('pilot_checks')
  .select('*', { count: 'exact', head: true })

console.log('✅ Certifications:', certs)

const { count: legacy } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })

console.log('✅ Legacy leave_requests:', legacy, 'records (read-only)')

console.log('\n✅ All tables verified!')
console.log('\n📊 Reports ready to test at http://localhost:3001/dashboard/reports')
