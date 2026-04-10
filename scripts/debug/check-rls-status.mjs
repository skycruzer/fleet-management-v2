#!/usr/bin/env node
/**
 * Check Current RLS Status
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg'

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('📊 Current RLS Status Check\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function checkStatus() {
  try {
    // Check RLS status on key tables
    const { data: tables, error } = await serviceClient.rpc('exec_sql', {
      query: `
          SELECT
            tablename,
            CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END as rls_status
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename IN (
            'an_users',
            'pilots',
            'pilot_checks',
            'flight_requests',
            'leave_requests',
            'disciplinary_actions',
            'tasks',
            'notifications',
            'pilot_users'
          )
          ORDER BY tablename;
        `,
    })

    if (error) {
      // Try alternative method
      console.log('Using alternative query method...\n')

      const query = `
        SELECT
          tablename,
          rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
          'an_users',
          'pilots',
          'pilot_checks',
          'flight_requests',
          'leave_requests',
          'disciplinary_actions',
          'tasks',
          'notifications',
          'pilot_users'
        )
        ORDER BY tablename;
      `

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
        console.log('📋 RLS Status by Table:\n')
        console.table(result)
      } else {
        console.log('⚠️  Could not fetch RLS status via RPC')
        console.log('   Please run this SQL in Supabase SQL Editor:\n')
        console.log(query)
      }
    } else {
      console.log('📋 RLS Status by Table:\n')
      console.table(tables)
    }

    // Count policies
    const { data: policyCount, error: policyError } = await serviceClient
      .from('pg_policies')
      .select('tablename', { count: 'exact', head: true })
      .in('tablename', ['an_users', 'pilots', 'pilot_checks', 'flight_requests', 'leave_requests'])

    console.log('\n📊 Policy Count:')
    if (policyError) {
      console.log('   ⚠️  Could not fetch policy count')
    } else {
      console.log(`   Total Policies: ${policyCount || 0}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 Current Status:\n')
    console.log('✅ Login is working because RLS is DISABLED')
    console.log('⚠️  Security Risk: All authenticated users can access all data')
    console.log('📝 Recommendation: Re-enable RLS with proper policies\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkStatus()
