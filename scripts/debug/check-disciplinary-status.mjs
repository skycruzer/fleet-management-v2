import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Checking disciplinary_matters table for status values...\n')

const { data, error } = await supabase
  .from('disciplinary_matters')
  .select('id, title, status, severity')
  .limit(10)

if (error) {
  console.error('Error fetching data:', error)
  process.exit(1)
}

console.log('Sample records:')
console.table(data)

console.log('\nUnique status values:')
const statuses = [...new Set(data.map((d) => d.status))]
console.log(statuses)

console.log('\nUnique severity values:')
const severities = [...new Set(data.map((d) => d.severity))]
console.log(severities)
