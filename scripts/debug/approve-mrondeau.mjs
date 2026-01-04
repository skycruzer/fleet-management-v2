import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

;(async () => {
  console.log('=== APPROVING MAURICE RONDEAU REGISTRATION ===\n')

  // Get the pending registration
  const { data: registration, error: fetchError } = await supabase
    .from('pilot_users')
    .select('*')
    .eq('email', 'mrondeau@airniugini.com.pg')
    .single()

  if (fetchError || !registration) {
    console.error('❌ Error: Could not find registration for mrondeau@airniugini.com.pg')
    console.error(fetchError)
    process.exit(1)
  }

  console.log('Found registration:')
  console.log('  ID:', registration.id)
  console.log('  Name:', registration.first_name, registration.last_name)
  console.log('  Email:', registration.email)
  console.log('  Rank:', registration.rank)
  console.log(
    '  Current Status:',
    registration.registration_approved === null
      ? 'PENDING'
      : registration.registration_approved
        ? 'APPROVED'
        : 'DENIED'
  )

  if (registration.registration_approved === true) {
    console.log('\n✅ Registration already approved!')
    process.exit(0)
  }

  console.log('\nApproving registration...')

  // Approve the registration
  const { data: updated, error: updateError } = await supabase
    .from('pilot_users')
    .update({
      registration_approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq('id', registration.id)
    .select()
    .single()

  if (updateError) {
    console.error('\n❌ Error approving registration:')
    console.error(updateError)
    process.exit(1)
  }

  console.log('\n✅ SUCCESS: Registration approved!')
  console.log('\nYou can now log in with:')
  console.log('  Email: mrondeau@airniugini.com.pg')
  console.log('  Password: Lemakot@1972')
  console.log('\nGo to: http://localhost:3000/portal/login')
})()
