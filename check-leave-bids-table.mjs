import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLeaveBidsTables() {
  console.log('=== CHECKING LEAVE BIDS TABLES ===\n')
  
  // Check if leave_bids table exists
  console.log('1. Checking leave_bids table...')
  const { data: leaveBids, error: leaveBidsError } = await supabase
    .from('leave_bids')
    .select('*')
    .limit(1)
  
  if (leaveBidsError) {
    console.log('❌ leave_bids table error:', leaveBidsError.message)
    console.log('Table may not exist or RLS is blocking access.')
  } else {
    console.log('✅ leave_bids table exists!')
    console.log('Sample row count:', leaveBids.length)
  }
  
  // Check if leave_bid_options table exists
  console.log('\n2. Checking leave_bid_options table...')
  const { data: bidOptions, error: bidOptionsError } = await supabase
    .from('leave_bid_options')
    .select('*')
    .limit(1)
  
  if (bidOptionsError) {
    console.log('❌ leave_bid_options table error:', bidOptionsError.message)
    console.log('Table may not exist or RLS is blocking access.')
  } else {
    console.log('✅ leave_bid_options table exists!')
    console.log('Sample row count:', bidOptions.length)
  }
  
  console.log('\n=== CHECK COMPLETE ===')
}

checkLeaveBidsTables()
