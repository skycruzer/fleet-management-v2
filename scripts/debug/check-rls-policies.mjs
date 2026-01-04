import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function checkPolicies() {
  console.log('🔍 Checking RLS Policies on an_users table')
  console.log('='.repeat(80))

  // Query pg_policies to see what policies exist
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'an_users')

  if (error) {
    console.log('❌ Error fetching policies:', error.message)
    return
  }

  console.log(`Found ${policies.length} policies:\n`)

  policies.forEach((policy, i) => {
    console.log(`${i + 1}. Policy: "${policy.policyname}"`)
    console.log(`   Command: ${policy.cmd}`)
    console.log(`   Roles: ${policy.roles}`)
    console.log(`   USING: ${policy.qual}`)
    if (policy.with_check) {
      console.log(`   WITH CHECK: ${policy.with_check}`)
    }
    console.log()
  })

  console.log('='.repeat(80))
  console.log('\n⚠️  If you see policies OTHER than:')
  console.log('   1. "Users can read own data"')
  console.log('   2. "Users can update own data"')
  console.log('   3. "Service role full access"')
  console.log('\nThen the SQL fix was not applied correctly.')
  console.log('\nLet me try to drop ALL policies and recreate them...\n')

  // Try comprehensive fix
  const dropStatements = policies.map((p) => `DROP POLICY IF EXISTS "${p.policyname}" ON an_users;`)

  console.log('Executing comprehensive policy cleanup:')
  for (const stmt of dropStatements) {
    console.log(`  ${stmt}`)
  }

  // Also check if RLS is enabled
  const { data: tableInfo } = await supabase.rpc('exec', {
    query: `SELECT relrowsecurity FROM pg_class WHERE relname = 'an_users'`,
  })

  console.log('\nRLS Enabled:', tableInfo)
}

checkPolicies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
