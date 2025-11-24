import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPilotLinkage() {
  console.log('🔍 Checking pilot linkage for mrondeau@airniugini.com.pg...\n')

  // Check pilot_users table
  const { data: pilotUser, error: userError } = await supabase
    .from('pilot_users')
    .select('*')
    .eq('email', 'mrondeau@airniugini.com.pg')
    .single()

  if (userError) {
    console.error('❌ Error fetching pilot_users:', userError)
    return
  }

  console.log('📋 pilot_users record:')
  console.log(JSON.stringify(pilotUser, null, 2))
  console.log('\n' + '='.repeat(80))

  // Check if pilot_id exists and find corresponding pilots record
  if (pilotUser.pilot_id) {
    console.log(`\n✅ pilot_id found: ${pilotUser.pilot_id}`)
    console.log('🔍 Looking up pilots table record...\n')

    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', pilotUser.pilot_id)
      .single()

    if (pilotError) {
      console.error('❌ Error fetching pilots record:', pilotError)
    } else {
      console.log('📋 pilots table record:')
      console.log(JSON.stringify(pilot, null, 2))
    }
  } else {
    console.log('\n❌ pilot_id is NULL - pilot_users record NOT linked to pilots table')
    console.log('\n🔍 Searching for matching pilot by employee_id...\n')

    // Try to find by employee_id
    if (pilotUser.employee_id) {
      const { data: matchingPilot, error: searchError } = await supabase
        .from('pilots')
        .select('*')
        .eq('employee_id', pilotUser.employee_id)
        .maybeSingle()

      if (searchError) {
        console.error('❌ Error searching pilots:', searchError)
      } else if (matchingPilot) {
        console.log('✅ Found matching pilot by employee_id:')
        console.log(JSON.stringify(matchingPilot, null, 2))
        console.log('\n💡 This pilot SHOULD be linked. pilot_id should be:', matchingPilot.id)
      } else {
        console.log('❌ No matching pilot found in pilots table by employee_id')
        
        // Check all pilots with similar name
        const { data: allPilots } = await supabase
          .from('pilots')
          .select('id, first_name, last_name, employee_id, rank')
          .ilike('last_name', '%rondeau%')

        if (allPilots && allPilots.length > 0) {
          console.log('\n🔍 Found pilots with similar name:')
          console.log(JSON.stringify(allPilots, null, 2))
        }
      }
    }
  }
}

checkPilotLinkage().catch(console.error)
