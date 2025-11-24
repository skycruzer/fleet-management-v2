import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  // Get one record to see structure (or just try inserting minimal record)
  const { data, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .limit(1)
  
  console.log('Existing data:', data)
  console.log('Error:', error)
  
  // Try minimal insert to see required fields
  const testInsert = {
    pilot_id: '00000000-0000-0000-0000-000000000000', // fake ID
    request_category: 'LEAVE',
    start_date: '2025-01-01',
    end_date: '2025-01-02',
  }
  
  const { error: insertError } = await supabase
    .from('pilot_requests')
    .insert([testInsert])
    .select()
  
  console.log('\nInsert error (shows required fields):', insertError?.message)
}

checkSchema()
