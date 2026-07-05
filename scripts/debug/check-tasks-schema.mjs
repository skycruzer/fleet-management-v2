import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

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
  sql: `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('status', 'priority') ORDER BY column_name;`,
})

if (schemaError) {
  console.log('\nSchema query error (RPC might not exist):', schemaError.message)
}

process.exit(0)
