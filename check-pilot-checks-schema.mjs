import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase
    .from('pilot_checks')
    .select('*')
    .limit(1)
  
  console.log('pilot_checks table schema:')
  if (data?.[0]) {
    console.log('Columns:', Object.keys(data[0]))
  }
  console.log('Error:', error?.message || 'None')
}

checkSchema()
