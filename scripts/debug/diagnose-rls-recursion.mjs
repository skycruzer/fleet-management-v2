#!/usr/bin/env node
/**
 * Deep Diagnosis of RLS Recursion Issue
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

console.log('🔬 Deep RLS Recursion Diagnosis\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function diagnose() {
  console.log('📋 Test 1: Check if RLS is enabled\n')

  try {
    // Check RLS status using service role
    const { data: tables, error: tableError } = await serviceClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'an_users')
      .single()

    if (tableError) {
      console.log('   ⚠️  Cannot query pg_tables:', tableError.message)
    } else {
      console.log(`   RLS Enabled: ${tables.rowsecurity}`)
    }
  } catch (e) {
    console.log('   ⚠️  Error:', e.message)
  }

  console.log('\n📋 Test 2: Query an_users with service role\n')

  try {
    const { data, error } = await serviceClient.from('an_users').select('id, email, role').limit(3)

    if (error) {
      console.log('   ❌ Service role query failed:', error.message)
      console.log('   Code:', error.code)

      if (error.code === '42P17') {
        console.log('\n   🚨 CRITICAL: Service role is hitting recursion!')
        console.log('   This should NEVER happen - service role bypasses RLS\n')
      }
    } else {
      console.log(`   ✅ Service role can query (found ${data.length} users)`)
      data.forEach((u) => console.log(`      - ${u.email} (${u.role})`))
    }
  } catch (e) {
    console.log('   ⚠️  Exception:', e.message)
  }

  console.log('\n📋 Test 3: Query an_users with anon role (authenticated)\n')

  try {
    // First authenticate
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    })

    if (authError) {
      console.log('   ❌ Auth failed:', authError.message)
    } else {
      console.log('   ✅ Authenticated as:', authData.user.email)

      // Try to query an_users as authenticated user
      const { data, error } = await anonClient
        .from('an_users')
        .select('id, email, role')
        .eq('id', authData.user.id)
        .single()

      if (error) {
        console.log('   ❌ Query failed:', error.message)
        console.log('   Code:', error.code)

        if (error.code === '42P17') {
          console.log('\n   🚨 Authenticated user hitting recursion!')
        }
      } else {
        console.log('   ✅ Can query own record:', data.email)
      }
    }
  } catch (e) {
    console.log('   ⚠️  Exception:', e.message)
  }

  console.log('\n📋 Test 4: Check for recursive policy definitions\n')

  try {
    // Try to get policy definitions
    const queries = [
      // Try different ways to get policy info
      `SELECT policyname, cmd, qual::text, with_check::text
       FROM pg_policies
       WHERE tablename = 'an_users'
       ORDER BY policyname`,

      `SELECT relname, relrowsecurity
       FROM pg_class
       WHERE relname = 'an_users'`,
    ]

    for (const query of queries) {
      console.log(`   Running: ${query.split('\n')[0]}...`)

      try {
        // Use raw SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ query }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('   ✅ Result:', JSON.stringify(result, null, 2))
        } else {
          console.log('   ⚠️  Status:', response.status)
        }
      } catch (e) {
        console.log('   ⚠️  Error:', e.message)
      }
    }
  } catch (e) {
    console.log('   ⚠️  Exception:', e.message)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💡 RECOMMENDATION:\n')
  console.log('Based on the results above, the issue is likely:')
  console.log('1. Policies are referencing an_users in their USING/CHECK clauses')
  console.log('2. This creates circular dependency when querying an_users')
  console.log('3. Even service role is affected (very unusual)\n')
  console.log('SOLUTION: We need to see the actual policy definitions')
  console.log('and rewrite them to NOT reference an_users table.\n')
}

diagnose()
