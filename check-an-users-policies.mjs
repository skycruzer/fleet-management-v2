#!/usr/bin/env node
/**
 * Check current RLS policies on an_users table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
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

console.log('🔍 Checking RLS policies on an_users table\n')

try {
  // Query pg_policies view
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'an_users')

  if (error) {
    console.error('❌ Error querying policies:', error.message)
    console.log('\nNote: pg_policies might not be accessible. This is normal.')
    console.log('The SQL fix needs to be applied in Supabase SQL Editor.\n')
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ No policies found (or unable to query pg_policies)')
    console.log('\nPlease apply the SQL fix in Supabase SQL Editor:')
    console.log('https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new\n')
    return
  }

  console.log(`Found ${data.length} policies:\n`)
  data.forEach((policy, i) => {
    console.log(`${i + 1}. ${policy.policyname}`)
    console.log(`   Command: ${policy.cmd}`)
    console.log(`   Roles: ${policy.roles?.join(', ')}`)
    console.log(`   USING: ${policy.qual}`)
    console.log(`   WITH CHECK: ${policy.with_check}`)
    console.log()
  })

} catch (error) {
  console.error('❌ Unexpected error:', error.message)
}
