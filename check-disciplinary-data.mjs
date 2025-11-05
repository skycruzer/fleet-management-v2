import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkxMTI2OSwiZXhwIjoyMDQ0NDg3MjY5fQ.Y_ynMAE6mnCuV3cVr82FhcpI1dBzAw4Z1fRH6KdXWI4'

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

console.log('\nStatus values:', data.map(d => d.status))
console.log('Severity values:', data.map(d => d.severity))

process.exit(0)
