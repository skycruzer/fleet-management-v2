import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Checking disciplinary_matters table actual data...\n')

const { data, error } = await supabase
  .from('disciplinary_matters')
  .select('id, title, status, severity')
  .limit(5)

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log('Actual records in database:')
console.table(data)

console.log(
  '\nStatus values:',
  data.map((d) => d.status)
)
console.log(
  'Severity values:',
  data.map((d) => d.severity)
)

process.exit(0)
