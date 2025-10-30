/**
 * Run RLS Policy Audit
 *
 * Connects to Supabase and extracts all RLS policies
 *
 * Developer: Maurice Rondeau
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

console.log('🔍 RLS Policy Audit Tool\n')

// Read environment variables from .env.local
let supabaseUrl, supabaseServiceKey

try {
  const envContent = readFileSync('.env.local', 'utf8')
  const lines = envContent.split('\n')

  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim()
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.local file')
  console.error('   Make sure .env.local exists with Supabase credentials')
  process.exit(1)
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\n   Please add these to your .env.local file')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`   Supabase URL: ${supabaseUrl}\n`)

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('📊 Extracting RLS policies from database...\n')

/**
 * Query RLS policies using pg_policies view
 */
async function extractRLSPolicies() {
  try {
    // Use Supabase's postgrest to query pg_policies
    // Note: This requires the pg_policies view to be accessible

    const query = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles::text as roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `

    const { data, error } = await supabase.rpc('query', {
      query_text: query
    }).select()

    if (error) {
      console.log('⚠️  RPC query not available, trying alternative approach...\n')

      // Alternative: Get list of tables and check if we can query them
      const tables = [
        'pilots', 'pilot_checks', 'leave_requests', 'flight_requests',
        'an_users', 'tasks', 'notifications', 'check_types',
        'contract_types', 'audit_logs', 'leave_bids', 'leave_bid_options',
        'disciplinary_actions', 'pilot_users'
      ]

      const policies = []

      for (const table of tables) {
        try {
          // Try to query the table to see if RLS is enabled
          const { error: queryError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          policies.push({
            tablename: table,
            hasRLS: queryError?.code === 'PGRST301', // RLS enabled error
            error: queryError?.message
          })
        } catch (err) {
          policies.push({
            tablename: table,
            hasRLS: 'unknown',
            error: err.message
          })
        }
      }

      return { policies, method: 'table-check' }
    }

    return { policies: data, method: 'direct-query' }

  } catch (err) {
    console.error('❌ Error:', err.message)
    throw err
  }
}

/**
 * Generate report from policies
 */
function generateReport(result) {
  const { policies, method } = result

  let report = `# RLS Policy Audit Report - LIVE DATA

**Generated**: ${new Date().toISOString()}
**Method**: ${method}
**Developer**: Maurice Rondeau

---

## Extraction Method

${method === 'direct-query'
  ? '✅ Successfully queried pg_policies view directly'
  : '⚠️ Could not query pg_policies directly - performed table-level RLS checks instead'
}

---

## Results

`

  if (method === 'direct-query' && policies.length > 0) {
    report += `
**Total Policies Found**: ${policies.length}

### Policies by Table

| Table | Policy Name | Command | Roles | Permissive |
|-------|-------------|---------|-------|------------|
`
    for (const policy of policies) {
      const roles = policy.roles || 'N/A'
      report += `| ${policy.tablename} | ${policy.policyname} | ${policy.cmd} | ${roles} | ${policy.permissive} |\n`
    }

    report += '\n### Policy Details\n\n'

    for (const policy of policies) {
      report += `#### ${policy.tablename}.${policy.policyname}\n\n`
      report += `**Command**: ${policy.cmd}\n`
      report += `**Roles**: ${policy.roles || 'N/A'}\n`
      report += `**Permissive**: ${policy.permissive}\n\n`
      report += '**USING clause**:\n```sql\n'
      report += policy.qual || 'NULL (no restrictions)'
      report += '\n```\n\n'
      if (policy.with_check) {
        report += '**WITH CHECK clause**:\n```sql\n'
        report += policy.with_check
        report += '\n```\n\n'
      }
      report += '---\n\n'
    }

  } else if (method === 'table-check') {
    report += `
**Tables Checked**: ${policies.length}

### RLS Status by Table

| Table | RLS Status | Notes |
|-------|------------|-------|
`
    for (const policy of policies) {
      const status = policy.hasRLS === true ? '✅ Enabled' :
                     policy.hasRLS === false ? '❌ Disabled' :
                     '⚠️ Unknown'
      const notes = policy.error || 'OK'
      report += `| ${policy.tablename} | ${status} | ${notes} |\n`
    }

    report += '\n\n'
  }

  report += `
## Next Steps

1. **Review this report** for RLS status
2. **Run SQL queries** in Supabase SQL Editor for detailed policy extraction
3. **Use the SQL script**: \`scripts/extract-rls-policies.sql\`
4. **Follow the guide**: \`RLS-POLICY-AUDIT.md\`

---

**Note**: For complete policy details (USING/WITH CHECK clauses), you must run the SQL script directly in Supabase SQL Editor.

The Supabase REST API and client libraries have limited access to PostgreSQL system catalogs for security reasons.

**Supabase SQL Editor**: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

---

**Generated by**: RLS Audit Script v1.0.0
**Timestamp**: ${new Date().toISOString()}
`

  return report
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📊 Step 1: Connecting to Supabase...')

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('pilots')
      .select('id', { count: 'exact', head: true })

    if (testError && testError.code !== 'PGRST301') {
      throw new Error(`Connection test failed: ${testError.message}`)
    }

    console.log('✅ Connected to Supabase\n')

    console.log('📊 Step 2: Extracting RLS policies...')
    const result = await extractRLSPolicies()

    if (result.method === 'direct-query') {
      console.log(`✅ Found ${result.policies.length} policies via direct query\n`)
    } else {
      console.log(`✅ Checked ${result.policies.length} tables for RLS status\n`)
    }

    console.log('📊 Step 3: Generating report...')
    const report = generateReport(result)

    // Write to file
    const filename = 'RLS-POLICY-AUDIT-RESULTS.md'
    writeFileSync(filename, report)
    console.log(`✅ Report written to ${filename}\n`)

    // Output summary
    console.log('📋 Summary:')
    if (result.method === 'direct-query') {
      console.log(`   Total Policies: ${result.policies.length}`)

      // Count by table
      const byTable = {}
      for (const p of result.policies) {
        byTable[p.tablename] = (byTable[p.tablename] || 0) + 1
      }
      console.log(`   Tables with Policies: ${Object.keys(byTable).length}`)
    } else {
      const enabled = result.policies.filter(p => p.hasRLS === true).length
      const disabled = result.policies.filter(p => p.hasRLS === false).length
      console.log(`   Tables with RLS Enabled: ${enabled}`)
      console.log(`   Tables with RLS Disabled: ${disabled}`)
    }

    console.log('\n✅ RLS audit complete!')
    console.log(`📄 Review the full report: ${filename}`)
    console.log('\n💡 For complete policy details, run the SQL script in Supabase SQL Editor:')
    console.log('   scripts/extract-rls-policies.sql')

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error('\n📝 Troubleshooting:')
    console.error('   1. Check your .env.local file has correct Supabase credentials')
    console.error('   2. Verify SUPABASE_SERVICE_ROLE_KEY is set (not ANON key)')
    console.error('   3. Check network connectivity to Supabase')
    console.error('   4. Run SQL script directly in Supabase SQL Editor instead')
    process.exit(1)
  }
}

main()
