import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkApiResponse() {
  console.log('Testing what the service layer returns...\n')

  // Simulate getPilotsGroupedByRank (used in pilots page)
  const { data: pilotsRaw, error } = await supabase
    .from('pilots')
    .select('*')
    .order('seniority_number', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Raw data returned from Supabase:')
  console.log('================================\n')
  console.log('First 3 pilots (full record):')
  pilotsRaw.slice(0, 3).forEach((pilot, idx) => {
    console.log('\nPilot ' + (idx + 1) + ':')
    console.log('  id: ' + pilot.id)
    console.log('  first_name: ' + pilot.first_name)
    console.log('  seniority_number: ' + pilot.seniority_number)
    console.log('  role: ' + pilot.role)
    console.log('  commencement_date: ' + pilot.commencement_date)
  })

  console.log('\n\nChecking what PilotsTable expects:')
  console.log('===================================\n')

  // Check what PilotTableRow interface expects
  const sampleTableRow = {
    id: pilotsRaw[0].id,
    seniority: pilotsRaw[0].seniority_number,
    first_name: pilotsRaw[0].first_name,
    last_name: pilotsRaw[0].last_name,
    role: pilotsRaw[0].role,
    is_active: pilotsRaw[0].is_active,
    commencement_date: pilotsRaw[0].commencement_date,
  }

  console.log('Expected PilotTableRow structure:')
  console.log(JSON.stringify(sampleTableRow, null, 2))
}

checkApiResponse().catch(console.error)
