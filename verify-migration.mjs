import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('=== Verifying Database Migration ===\n')

// 1. Check if user_id column exists in pilots table
console.log('1. Checking user_id column...')
try {
  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, user_id')
    .limit(5)

  if (error) {
    console.error('❌ Error querying pilots table:', error.message)
  } else {
    console.log('✅ user_id column exists in pilots table')
    console.log(`   Found ${pilots.length} pilot records\n`)
  }
} catch (err) {
  console.error('❌ Failed to query pilots table:', err.message)
}

// 2. Check if Maurice Rondeau is linked
console.log('2. Checking Maurice Rondeau pilot-user link...')
try {
  const { data: mauricePilot, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, user_id')
    .ilike('last_name', '%rondeau%')
    .single()

  if (error) {
    console.error('❌ Error finding Maurice Rondeau:', error.message)
  } else if (!mauricePilot.user_id) {
    console.log('⚠️  Maurice Rondeau found but not linked to user account')
    console.log(`   Pilot ID: ${mauricePilot.id}`)
    console.log(`   Name: ${mauricePilot.first_name} ${mauricePilot.last_name}`)
  } else {
    console.log('✅ Maurice Rondeau is linked to user account')
    console.log(`   Pilot ID: ${mauricePilot.id}`)
    console.log(`   User ID: ${mauricePilot.user_id}`)
    console.log(`   Name: ${mauricePilot.first_name} ${mauricePilot.last_name}\n`)
  }
} catch (err) {
  console.error('❌ Failed to check Maurice Rondeau:', err.message)
}

// 3. Check if notifications table exists
console.log('3. Checking notifications table...')
try {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id')
    .limit(1)

  if (error) {
    console.error('❌ Error querying notifications table:', error.message)
  } else {
    console.log('✅ Notifications table exists and is accessible\n')
  }
} catch (err) {
  console.error('❌ Failed to query notifications table:', err.message)
}

// 4. Summary
console.log('=== Migration Verification Complete ===\n')
console.log('Next steps:')
console.log('1. Test pilot login at http://localhost:3000/portal/login')
console.log('   Email: mrondeau@airniugini.com.pg')
console.log('   Password: Lemakot@1972')
console.log('2. Verify pilot can access dashboard and submit requests')
console.log('3. Check admin portal to see if requests appear')
