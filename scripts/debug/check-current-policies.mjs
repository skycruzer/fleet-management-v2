#!/usr/bin/env node
/**
 * Check Current RLS Policies on an_users
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('🔍 Checking Current RLS Policies\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkPolicies() {
  try {
    // Query pg_policies to see what policies exist
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql_query: `
          SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles::text[],
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'an_users'
          ORDER BY policyname;
        `,
    })

    if (error) {
      console.log('⚠️  Cannot query pg_policies directly\n')
      console.log('Trying alternative method...\n')

      // Try a direct query to see if we can access an_users
      const { data: users, error: userError } = await supabase
        .from('an_users')
        .select('id, email, role')
        .limit(1)

      if (userError) {
        console.log('❌ Error accessing an_users:', userError.message)
        console.log('   Code:', userError.code)

        if (userError.code === '42P17') {
          console.log('\n⚠️  INFINITE RECURSION STILL EXISTS!\n')
          console.log('The policies were NOT applied correctly.')
          console.log('\nPossible reasons:')
          console.log('1. SQL execution failed silently')
          console.log('2. There are additional policies not dropped')
          console.log('3. There are triggers or functions causing recursion\n')
        }
      } else {
        console.log('✅ Can access an_users with service role')
        console.log(`   Found user: ${users[0]?.email}\n`)
      }

      return
    }

    console.log(`Found ${policies?.length || 0} policies:\n`)

    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`${index + 1}. ${policy.policyname}`)
        console.log(`   Command: ${policy.cmd}`)
        console.log(`   Roles: ${policy.roles?.join(', ')}`)
        console.log(`   Permissive: ${policy.permissive}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No policies found! This might mean:')
      console.log('   - SQL was not executed')
      console.log('   - Policies were not created')
      console.log('   - Or query method is not working\n')
    }
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkPolicies()
