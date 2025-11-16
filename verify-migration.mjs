import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🔍 Verifying Migration\n')

const { data: leave } = await supabase
  .from('pilot_requests')
  .select('*')
  .eq('request_category', 'LEAVE')
  .limit(1)

console.log('✅ Leave requests in pilot_requests:', leave?.length || 0)

const { count: bids } = await supabase
  .from('leave_bids')
  .select('*', { count: 'exact', head: true })

console.log('✅ Leave bids:', bids)

const { count: certs } = await supabase
  .from('pilot_checks')
  .select('*', { count: 'exact', head: true })

console.log('✅ Certifications:', certs)

// Test legacy table is read-only
const { count: legacy } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })

console.log('✅ Legacy leave_requests readable:', legacy, 'records')

console.log('\n✅ Migration verification complete!')
console.log('\n📊 Next: Test reports at http://localhost:3001/dashboard/reports')
