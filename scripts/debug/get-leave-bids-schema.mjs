import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getSchema() {
  console.log('=== CHECKING leave_bids TABLE SCHEMA ===\n')
  
  // Get the table structure
  const { data, error } = await supabase
    .from('leave_bids')
    .select('*')
    .limit(1)
  
  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('leave_bids table columns:')
    if (data.length > 0) {
      console.log(Object.keys(data[0]))
    } else {
      console.log('No data yet, checking all data...')
      const { data: allData } = await supabase.from('leave_bids').select('*')
      console.log('Total rows:', allData?.length || 0)
    }
  }
}

getSchema()
