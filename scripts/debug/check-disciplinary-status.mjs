import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5MTEyNjksImV4cCI6MjA0NDQ4NzI2OX0.VyvIL6dMzaL0uoFBID3c3dl7Y6w6yXuANeYeJEUk-14'

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
