import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigration() {
  try {
    // Check if pilot_registrations table exists
    const { count, error } = await supabase
      .from('pilot_registrations')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log('❌ Migration NOT deployed')
      console.log('Error:', error.message)
      return false
    } else {
      console.log('✅ Migration IS deployed')
      console.log('pilot_registrations table exists with', count || 0, 'records')
      return true
    }
  } catch (err) {
    console.error('Connection error:', err.message)
    return false
  }
}

checkMigration()
