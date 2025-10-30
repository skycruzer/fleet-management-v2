import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies on an_users table')
  console.log('='.repeat(80))

  const sql = `
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read own data" ON an_users;
DROP POLICY IF EXISTS "Users can update own data" ON an_users;
DROP POLICY IF EXISTS "Admins can read all users" ON an_users;
DROP POLICY IF EXISTS "Admins can update all users" ON an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data"
ON an_users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON an_users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role has full access"
ON an_users FOR ALL
TO service_role
USING (true);
  `.trim()

  console.log('📝 Executing SQL:')
  console.log(sql)
  console.log()

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

  if (error) {
    // Try direct SQL query instead
    console.log('⚠️  RPC failed, trying direct query...')

    // Execute policies one by one
    const queries = [
      'DROP POLICY IF EXISTS "Users can read own data" ON an_users',
      'DROP POLICY IF EXISTS "Users can update own data" ON an_users',
      'DROP POLICY IF EXISTS "Admins can read all users" ON an_users',
      'DROP POLICY IF EXISTS "Admins can update all users" ON an_users',
      'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users" ON an_users',
      'DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users',
      `CREATE POLICY "Users can read own data" ON an_users FOR SELECT TO authenticated USING (auth.uid() = id)`,
      `CREATE POLICY "Users can update own data" ON an_users FOR UPDATE TO authenticated USING (auth.uid() = id)`,
      `CREATE POLICY "Service role has full access" ON an_users FOR ALL TO service_role USING (true)`,
    ]

    console.log('❌ Cannot execute SQL via client')
    console.log('⚠️  You must run the SQL manually in Supabase SQL Editor:')
    console.log('📍 https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new')
    console.log()
    console.log('Copy and run this SQL:')
    console.log('='.repeat(80))
    console.log(sql)
    console.log('='.repeat(80))
    return false
  }

  console.log('✅ RLS policies fixed successfully!')
  console.log()
  return true
}

fixRLSPolicies()
  .then((success) => {
    if (success) {
      console.log('='.repeat(80))
      console.log('✅ RLS FIX COMPLETE')
      console.log('   Admin login should now work!')
      console.log('='.repeat(80))
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
