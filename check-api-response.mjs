import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

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
