/**
 * Check RLS policies on an_users table
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSPolicies() {
  console.log('Checking RLS policies on an_users table...\n')

  // Query pg_policies to see all policies on an_users
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual::text as using_clause,
        with_check::text as check_clause
      FROM pg_policies
      WHERE tablename = 'an_users'
      ORDER BY policyname;
    `
  })

  if (error) {
    console.error('Error fetching policies (RPC not available, trying direct query):', error.message)

    // Try direct query
    const { data: directData, error: directError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'an_users')

    if (directError) {
      console.error('Cannot access pg_policies:', directError.message)
      console.log('\nPlease run this SQL in Supabase SQL Editor:\n')
      console.log(`
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as check_clause
FROM pg_policies
WHERE tablename = 'an_users'
ORDER BY policyname;
      `)
      return
    }

    console.log('Found policies:', JSON.stringify(directData, null, 2))
    return
  }

  if (!data || data.length === 0) {
    console.log('No policies found on an_users table')
    return
  }

  console.log(`Found ${data.length} RLS policies on an_users:\n`)
  data.forEach((policy, i) => {
    console.log(`${i + 1}. Policy: ${policy.policyname}`)
    console.log(`   Command: ${policy.cmd}`)
    console.log(`   Roles: ${policy.roles}`)
    console.log(`   Permissive: ${policy.permissive}`)
    console.log(`   USING clause: ${policy.using_clause}`)
    console.log(`   CHECK clause: ${policy.check_clause || 'N/A'}`)
    console.log('')
  })
}

async function checkTableRLS() {
  console.log('\nChecking if RLS is enabled on an_users...\n')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE tablename = 'an_users';
    `
  })

  if (error) {
    console.log('Cannot check RLS status (RPC not available)')
    console.log('\nPlease run this SQL in Supabase SQL Editor:\n')
    console.log(`
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'an_users';
    `)
    return
  }

  console.log('RLS Status:', data)
}

async function main() {
  await checkTableRLS()
  await checkRLSPolicies()

  console.log('\n' + '='.repeat(80))
  console.log('ANALYSIS COMPLETE')
  console.log('='.repeat(80))
  console.log('\nLook for policies that contain:')
  console.log('1. Subqueries selecting from an_users within the USING clause')
  console.log('2. JOINs to an_users within the policy')
  console.log('3. Functions that internally query an_users')
  console.log('\nThese patterns can cause infinite recursion.')
}

main().catch(console.error)
