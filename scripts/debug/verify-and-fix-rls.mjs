#!/usr/bin/env node
/**
 * Verify RLS Status and Re-enable with Proper Policies
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk';

console.log('🔐 RLS Status Check & Fix\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAndFix() {
  try {
    // Step 1: Check if RLS is currently disabled
    console.log('📋 Step 1: Checking current RLS status\n');

    // Try to query an_users with anon key (will fail if RLS has recursion)
    const { data: testData, error: testError } = await anonClient
      .from('an_users')
      .select('id')
      .limit(1);

    if (testError) {
      if (testError.code === '42P17') {
        console.log('   ❌ RLS has infinite recursion error');
        console.log('   ⚠️  You need to disable RLS first!\n');
        console.log('   Run this in Supabase SQL Editor:');
        console.log('   ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;\n');
        return;
      } else if (testError.code === 'PGRST301') {
        console.log('   ⚠️  RLS is enabled but blocking access');
        console.log('   This might be okay if policies are too restrictive\n');
      } else {
        console.log(`   ⚠️  Error: ${testError.message} (${testError.code})\n`);
      }
    } else {
      console.log('   ✅ Can query an_users table (RLS might be disabled or working)\n');
    }

    // Step 2: Check admin user exists
    console.log('📋 Step 2: Verifying admin user\n');

    const { data: adminUser, error: adminError } = await serviceClient
      .from('an_users')
      .select('*')
      .eq('email', 'skycruzer@icloud.com')
      .single();

    if (adminError) {
      console.log('   ❌ Cannot find admin user:', adminError.message);
      return;
    }

    console.log('   ✅ Admin user found:');
    console.log(`      ID: ${adminUser.id}`);
    console.log(`      Email: ${adminUser.email}`);
    console.log(`      Role: ${adminUser.role}\n`);

    // Step 3: Show SQL to re-enable RLS
    console.log('📋 Step 3: SQL to Re-enable RLS with Proper Policies\n');

    const sql = `
-- ============================================================================
-- STEP 1: Drop ALL existing policies (cleanup)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own data" ON an_users;
DROP POLICY IF EXISTS "Users can update their own data" ON an_users;
DROP POLICY IF EXISTS "Admins can view all users" ON an_users;
DROP POLICY IF EXISTS "Admins can insert users" ON an_users;
DROP POLICY IF EXISTS "Admins can update all users" ON an_users;
DROP POLICY IF EXISTS "Admins can delete users" ON an_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON an_users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users;
DROP POLICY IF EXISTS "Users can read their own data" ON an_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON an_users;
DROP POLICY IF EXISTS "Users can read own record" ON an_users;
DROP POLICY IF EXISTS "Service role can insert users" ON an_users;
DROP POLICY IF EXISTS "Users can update own record" ON an_users;
DROP POLICY IF EXISTS "Service role can delete users" ON an_users;

-- ============================================================================
-- STEP 2: Enable RLS
-- ============================================================================

ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create NEW simple policies (NO circular references!)
-- ============================================================================

-- Policy 1: Allow authenticated users to read their own record
-- KEY: Uses auth.uid() = id which does NOT query an_users recursively
CREATE POLICY "authenticated_read_own"
ON an_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow authenticated users to update their own record
CREATE POLICY "authenticated_update_own"
ON an_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Service role can do everything (bypasses RLS)
-- This is used by middleware to check admin status
CREATE POLICY "service_role_all"
ON an_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

GRANT SELECT, UPDATE ON an_users TO authenticated;
GRANT ALL ON an_users TO service_role;

-- ============================================================================
-- STEP 5: Verify policies
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'an_users'
ORDER BY policyname;
`;

    console.log('   Copy this SQL to Supabase SQL Editor:\n');
    console.log('   https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql\n');

    // Save SQL to file
    const fs = await import('fs');
    fs.writeFileSync('enable-rls-proper-policies.sql', sql);
    console.log('   ✅ SQL saved to: enable-rls-proper-policies.sql\n');

    // Step 4: Test login flow
    console.log('📋 Step 4: Testing Login Flow\n');

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    });

    if (authError) {
      console.log('   ❌ Login failed:', authError.message);
      return;
    }

    console.log('   ✅ Login successful');
    console.log(`   User ID: ${authData.user.id}\n`);

    // Step 5: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Verification Complete\n');

    console.log('📝 Next Steps:\n');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql\n');

    console.log('2. Copy and run the SQL from:');
    console.log('   enable-rls-proper-policies.sql\n');

    console.log('3. Test login at:');
    console.log('   http://localhost:3000/auth/login\n');

    console.log('4. Verify with:');
    console.log('   node test-real-browser-login.mjs\n');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error(error);
  }
}

checkAndFix();
