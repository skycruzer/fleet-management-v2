import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5MTEyNjksImV4cCI6MjA0NDQ4NzI2OX0.VyvIL6dMzaL0uoFBID3c3dl7Y6w6yXuANeYeJEUk-14'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Checking tasks table...\n')

// First check if tasks table exists and has any data
const { data, error, count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true })

if (error) {
  console.log('Tasks table might not exist or RLS blocking:', error.message)
} else {
  console.log(`Tasks table has ${count} records`)
}

// Try to query the database schema for tasks table
const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
  sql: `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('status', 'priority') ORDER BY column_name;`
})

if (schemaError) {
  console.log('\nSchema query error (RPC might not exist):', schemaError.message)
}

process.exit(0)
