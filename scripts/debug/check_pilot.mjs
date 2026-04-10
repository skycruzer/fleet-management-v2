import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Get first pilot
const { data, error } = await supabase
  .from('pilots')
  .select('*')
  .order('seniority_number')
  .limit(1)
  .single()

if (error) {
  console.error('Error:', error)
} else {
  console.log('First Pilot Data:')
  console.log(JSON.stringify(data, null, 2))
  console.log('\nName fields:')
  console.log('- first_name:', data.first_name)
  console.log('- middle_name:', data.middle_name)
  console.log('- last_name:', data.last_name)
  console.log(
    '- Full name:',
    [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
  )
  console.log('\nRetirement fields:')
  console.log('- date_of_birth:', data.date_of_birth)
  console.log('- commencement_date:', data.commencement_date)
}
