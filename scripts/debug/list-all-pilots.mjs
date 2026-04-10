import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('Fetching all pilots...\n')

const { data: pilots, error } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, rank, employee_id')
  .order('last_name', { ascending: true })
  .limit(10)

if (error) {
  console.error('Error:', error)
} else {
  console.log(`Found ${pilots.length} pilots:\n`)
  pilots.forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.first_name} ${p.last_name} (${p.rank}) - Employee ID: ${p.employee_id} - Pilot ID: ${p.id}`
    )
  })
}
