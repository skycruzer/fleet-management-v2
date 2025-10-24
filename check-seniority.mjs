import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSeniority() {
  console.log('Fetching pilots to check seniority_number field...\n')

  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, seniority_number, commencement_date, role')
    .order('seniority_number', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!pilots || pilots.length === 0) {
    console.log('No pilots found')
    return
  }

  console.log('Found ' + pilots.length + ' pilots\n')
  console.log('Sample of 10 pilots:')
  console.log('='.repeat(100))
  console.log(
    'Seniority | Name                           | Role            | Commencement Date | Field Status'
  )
  console.log('='.repeat(100))

  pilots.slice(0, 10).forEach((pilot) => {
    const seniority = pilot.seniority_number || 'NULL'
    const name = pilot.first_name + ' ' + pilot.last_name
    const role = pilot.role || 'N/A'
    const date = pilot.commencement_date || 'N/A'
    const status = pilot.seniority_number ? 'FILLED' : 'NULL'

    console.log(
      String(seniority).padEnd(9) +
        ' | ' +
        name.padEnd(30) +
        ' | ' +
        role.padEnd(15) +
        ' | ' +
        date +
        ' | ' +
        status
    )
  })

  console.log('='.repeat(100))

  const withSeniority = pilots.filter((p) => p.seniority_number !== null).length
  const withoutSeniority = pilots.filter((p) => p.seniority_number === null).length

  console.log('\nStatistics:')
  console.log('  Pilots WITH seniority_number: ' + withSeniority + ' (' + ((withSeniority / pilots.length) * 100).toFixed(1) + '%)')
  console.log('  Pilots WITHOUT seniority_number: ' + withoutSeniority + ' (' + ((withoutSeniority / pilots.length) * 100).toFixed(1) + '%)')

  if (withoutSeniority > 0) {
    console.log(
      '\nWARNING: Some pilots have NULL seniority_number values!\nThis is why the seniority column appears empty in the UI.'
    )
  }
}

checkSeniority().catch(console.error)
