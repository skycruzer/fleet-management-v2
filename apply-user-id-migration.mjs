import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('=== Applying user_id Migration to pilots Table ===\n')

// Read migration SQL
const migrationSQL = readFileSync('./supabase/migrations/20251026_add_user_id_to_pilots.sql', 'utf-8')

console.log('Migration SQL:')
console.log(migrationSQL)
console.log('\nExecuting migration...\n')

// Execute migration
const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

if (error) {
  console.error('❌ Migration failed:', error.message)
  console.error('Details:', error)

  // Try executing statements individually
  console.log('\nTrying individual statements...\n')

  const statements = [
    'ALTER TABLE pilots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;',
    'CREATE INDEX IF NOT EXISTS idx_pilots_user_id ON pilots(user_id);',
    "COMMENT ON COLUMN pilots.user_id IS 'Links pilot record to Supabase Auth user for portal access';"
  ]

  for (const [index, stmt] of statements.entries()) {
    console.log(`Executing statement ${index + 1}...`)
    const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt })

    if (stmtError) {
      console.error(`❌ Statement ${index + 1} failed:`, stmtError.message)
    } else {
      console.log(`✅ Statement ${index + 1} succeeded`)
    }
  }
} else {
  console.log('✅ Migration applied successfully!')
}

// Verify column was added
console.log('\nVerifying user_id column...')
const { data: pilots, error: verifyError } = await supabase
  .from('pilots')
  .select('id, first_name, last_name, user_id')
  .limit(1)

if (verifyError) {
  console.error('❌ Verification failed:', verifyError.message)
} else {
  console.log('✅ user_id column verified in pilots table')
  console.log('Sample pilot record:', pilots[0])
}

console.log('\n=== Migration Complete ===')
