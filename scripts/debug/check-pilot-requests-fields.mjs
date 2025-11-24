import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFields() {
  const { data, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .limit(1)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Sample pilot_requests record fields:')
    console.log(Object.keys(data[0]))
  } else {
    console.log('No leave requests found in pilot_requests table')
  }
}

checkFields()
