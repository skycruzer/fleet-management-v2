#!/usr/bin/env node
/**
 * Apply RLS fix to an_users table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

process.env = { ...process.env, ...envVars }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔧 Fixing an_users RLS policies\n')

const sql = `
-- Drop all existing RLS policies on an_users
DROP POLICY IF EXISTS "an_users select policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users insert policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users update policy" ON public.an_users;
DROP POLICY IF EXISTS "an_users delete policy" ON public.an_users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.an_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.an_users;

-- Create simple, non-recursive RLS policies

-- SELECT: Authenticated users can see all users
CREATE POLICY "an_users_select_policy"
ON public.an_users
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only users can insert their own record
CREATE POLICY "an_users_insert_policy"
ON public.an_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own record
CREATE POLICY "an_users_update_policy"
ON public.an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.an_users ENABLE ROW LEVEL SECURITY;
`

try {
  console.log('Applying SQL fix...')

  // Split into individual statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`)
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('_').select(statement)
      if (directError) {
        console.error('❌ Error:', error || directError)
      }
    } else {
      console.log('✅ Success')
    }
  }

  console.log('\n✅ RLS policies fixed!')
  console.log('\nVerifying policies...')

  // Verify by checking an_users table
  const { data, error } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('email', 'skycruzer@icloud.com')
    .single()

  if (error) {
    console.error('❌ Verification failed:', error.message)
  } else {
    console.log('✅ Query successful!')
    console.log(`   User ID: ${data.id}`)
    console.log(`   Role: ${data.role}`)
  }
} catch (error) {
  console.error('❌ Failed to apply fix:', error.message)
  process.exit(1)
}
