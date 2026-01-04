import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  console.log('Checking pilot_users table...\n')

  // Try to query the table
  const { data, error } = await supabase.from('pilot_users').select('*').limit(1)

  if (error) {
    console.log('❌ ERROR:', error.message)
    console.log('Code:', error.code)
    console.log('\nThe pilot_users table may not exist or RLS policies are blocking access.')
  } else {
    console.log('✅ SUCCESS: pilot_users table exists!')
    console.log('Sample data:', data)
  }
}

checkTable()
