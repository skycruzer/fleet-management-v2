import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('Checking for pilot with email: mrondeau@airniugini.com.pg\n')

// Check if pilot exists
const { data: pilots, error } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, email, rank')
  .eq('email', 'mrondeau@airniugini.com.pg')

if (error) {
  console.error('Error:', error)
} else if (pilots.length === 0) {
  console.log('❌ No pilot found with email mrondeau@airniugini.com.pg')
  console.log('\nLet me check all pilots with similar names:')

  const { data: allPilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, email, rank')
    .or('last_name.ilike.%rondeau%,email.ilike.%rondeau%')

  if (allPilots && allPilots.length > 0) {
    console.log('Found similar pilots:')
    allPilots.forEach((p) => {
      console.log(`  - ${p.first_name} ${p.last_name} (${p.email}) - ${p.rank}`)
    })
  } else {
    console.log('No pilots found with similar names')
  }
} else {
  console.log('✅ Found pilot:')
  pilots.forEach((p) => {
    console.log(`  ID: ${p.id}`)
    console.log(`  Name: ${p.first_name} ${p.last_name}`)
    console.log(`  Email: ${p.email}`)
    console.log(`  Rank: ${p.rank}`)
  })
}
