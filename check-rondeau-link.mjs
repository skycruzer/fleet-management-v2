import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('=== Checking Maurice Rondeau Pilot-User Link ===\n')

// Find all pilots with "Rondeau" in last name
const { data: pilots, error } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, user_id')
  .ilike('last_name', '%rondeau%')

if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log(`Found ${pilots.length} pilot(s) with "Rondeau" in last name:\n`)
  pilots.forEach((pilot, i) => {
    console.log(`${i + 1}. ${pilot.first_name} ${pilot.last_name}`)
    console.log(`   Pilot ID: ${pilot.id}`)
    console.log(`   User ID: ${pilot.user_id || 'NOT LINKED'}`)
    console.log('')
  })
}

// Check if there's a user with mrondeau@airniugini.com.pg email
console.log('\n=== Checking Auth User ===\n')

// We can't query auth.users directly with anon key, so we'll just confirm the migration ran
console.log('The migration should have linked the pilot with last name containing "rondeau"')
console.log('to the auth user with email: mrondeau@airniugini.com.pg')
console.log('\nIf user_id is shown above, the link was successful! ✅')
