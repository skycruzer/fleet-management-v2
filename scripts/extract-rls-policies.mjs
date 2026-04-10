/**
 * Extract RLS Policies from Supabase Database
 *
 * Queries pg_policies system catalog to extract all Row Level Security policies
 * and generates a comprehensive audit report.
 *
 * Developer: Maurice Rondeau
 * Sprint: Sprint 1 Days 3-4 (Task 4)
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { writeFileSync } from 'fs'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Extracting RLS policies from database...\n')

/**
 * Query all RLS policies from pg_policies
 */
async function extractRLSPolicies() {
  try {
    // Query pg_policies system catalog
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `,
    })

    if (error) {
      // Try alternative approach using direct query
      console.log('⚠️  exec_sql RPC not available, trying direct query...\n')

      const { data: policies, error: queryError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .order('tablename')
        .order('policyname')

      if (queryError) {
        throw queryError
      }

      return policies
    }

    return data
  } catch (err) {
    console.error('❌ Error extracting policies:', err)
    throw err
  }
}

/**
 * Get table RLS status
 */
async function getTableRLSStatus() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) throw error

    // For each table, check if RLS is enabled
    const tables = []
    for (const table of data || []) {
      // Query pg_tables to get RLS status
      const { data: rlsData } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT
              tablename,
              rowsecurity as rls_enabled
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename = '${table.table_name}';
          `,
        })
        .single()

      tables.push({
        name: table.table_name,
        rlsEnabled: rlsData?.rls_enabled || false,
      })
    }

    return tables
  } catch (err) {
    console.log('⚠️  Could not fetch table RLS status')
    return []
  }
}

/**
 * Organize policies by table
 */
function organizePoliciesByTable(policies) {
  const byTable = {}

  for (const policy of policies) {
    const table = policy.tablename
    if (!byTable[table]) {
      byTable[table] = []
    }
    byTable[table].push(policy)
  }

  return byTable
}

/**
 * Analyze policy for security issues
 */
function analyzePolicyForIssues(policy) {
  const issues = []
  const warnings = []

  // Check for overly permissive policies
  if (policy.qual === null || policy.qual === 'true' || policy.qual === '') {
    issues.push('Overly permissive: No restrictions (qual is NULL or true)')
  }

  // Check for public role
  if (policy.roles?.includes('public')) {
    warnings.push('Policy applies to public role - ensure this is intended')
  }

  // Check for anon role
  if (policy.roles?.includes('anon')) {
    warnings.push('Policy applies to anon role - ensure authentication is not bypassed')
  }

  // Check for authenticated role without restrictions
  if (policy.roles?.includes('authenticated') && !policy.qual) {
    issues.push('Authenticated users have unrestricted access')
  }

  // Check DELETE policies
  if (policy.cmd === 'DELETE' && (!policy.qual || policy.qual === 'true')) {
    issues.push('DELETE policy has no restrictions - users can delete any row')
  }

  // Check INSERT/UPDATE with_check
  if (['INSERT', 'UPDATE'].includes(policy.cmd) && !policy.with_check) {
    warnings.push(`${policy.cmd} policy has no with_check constraint`)
  }

  return { issues, warnings }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(policies, tables) {
  const byTable = organizePoliciesByTable(policies)
  const tableNames = Object.keys(byTable).sort()

  let markdown = `# RLS Policy Audit Report

**Generated**: ${new Date().toISOString()}
**Developer**: Maurice Rondeau
**Sprint**: Sprint 1 Days 3-4 (Task 4)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Tables** | ${tableNames.length} |
| **Total Policies** | ${policies.length} |
| **Tables with RLS** | ${tables.filter((t) => t.rlsEnabled).length} |
| **Tables without RLS** | ${tables.filter((t) => !t.rlsEnabled).length} |

---

## Policy Analysis by Table

`

  let totalIssues = 0
  let totalWarnings = 0

  for (const tableName of tableNames) {
    const tablePolicies = byTable[tableName]
    const tableInfo = tables.find((t) => t.name === tableName)

    markdown += `\n### Table: \`${tableName}\`\n\n`
    markdown += `**RLS Enabled**: ${tableInfo?.rlsEnabled ? '✅ Yes' : '❌ No'}\n`
    markdown += `**Policy Count**: ${tablePolicies.length}\n\n`

    if (tablePolicies.length === 0) {
      markdown += '⚠️ **WARNING**: No policies defined for this table\n\n'
      totalWarnings++
      continue
    }

    markdown += '| Policy Name | Command | Roles | Permissive | Issues |\n'
    markdown += '|-------------|---------|-------|------------|--------|\n'

    for (const policy of tablePolicies) {
      const { issues, warnings } = analyzePolicyForIssues(policy)
      totalIssues += issues.length
      totalWarnings += warnings.length

      const rolesStr = Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles || 'N/A'

      const issueStr =
        [...issues, ...warnings].length > 0 ? `⚠️ ${[...issues, ...warnings].join('; ')}` : '✅ OK'

      markdown += `| ${policy.policyname} | ${policy.cmd} | ${rolesStr} | ${policy.permissive} | ${issueStr} |\n`
    }

    markdown += '\n#### Policy Details\n\n'

    for (const policy of tablePolicies) {
      markdown += `**${policy.policyname}** (\`${policy.cmd}\`)\n`
      markdown += '```sql\n'
      markdown += `-- USING clause:\n${policy.qual || 'NULL (no restrictions)'}\n\n`
      if (policy.with_check) {
        markdown += `-- WITH CHECK clause:\n${policy.with_check}\n`
      }
      markdown += '```\n\n'
    }
  }

  markdown += `\n---

## Security Analysis Summary

| Category | Count |
|----------|-------|
| **Critical Issues** | ${totalIssues} |
| **Warnings** | ${totalWarnings} |

`

  if (totalIssues > 0) {
    markdown += `\n### 🚨 Critical Issues Identified

These issues require immediate attention:

`
    for (const tableName of tableNames) {
      const tablePolicies = byTable[tableName]
      for (const policy of tablePolicies) {
        const { issues } = analyzePolicyForIssues(policy)
        if (issues.length > 0) {
          markdown += `- **${tableName}.${policy.policyname}**: ${issues.join(', ')}\n`
        }
      }
    }
  }

  if (totalWarnings > 0) {
    markdown += `\n### ⚠️ Warnings

These should be reviewed:

`
    for (const tableName of tableNames) {
      const tablePolicies = byTable[tableName]
      for (const policy of tablePolicies) {
        const { warnings } = analyzePolicyForIssues(policy)
        if (warnings.length > 0) {
          markdown += `- **${tableName}.${policy.policyname}**: ${warnings.join(', ')}\n`
        }
      }
    }
  }

  markdown += `\n---

## Tables Without RLS

`

  const tablesWithoutRLS = tables.filter((t) => !t.rlsEnabled)
  if (tablesWithoutRLS.length > 0) {
    markdown += 'The following tables do not have RLS enabled:\n\n'
    for (const table of tablesWithoutRLS) {
      markdown += `- \`${table.name}\`\n`
    }
    markdown +=
      '\n⚠️ **Action Required**: Enable RLS on these tables if they contain sensitive data.\n'
  } else {
    markdown += '✅ All tables have RLS enabled.\n'
  }

  markdown += `\n---

## Recommendations

### High Priority

1. **Fix Critical Issues**: ${totalIssues} critical security issues identified above
2. **Enable RLS**: ${tablesWithoutRLS.length} tables without RLS protection
3. **Review Public/Anon Policies**: Ensure these are intentional and secure

### Medium Priority

1. **Review DELETE Policies**: Ensure proper restrictions on row deletion
2. **Add WITH CHECK Constraints**: ${totalWarnings} policies missing constraints
3. **Document Policy Intent**: Add comments to complex policies

### Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Test All Policies**: Create RLS test suite to verify policy behavior
3. **Regular Audits**: Review policies quarterly or after major changes
4. **Monitor Policy Performance**: Check for slow queries due to complex policies

---

**Generated by**: RLS Policy Extraction Script v1.0.0
**Last Updated**: ${new Date().toISOString()}
`

  return markdown
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📊 Step 1: Extracting RLS policies...')
    const policies = await extractRLSPolicies()
    console.log(`✅ Found ${policies.length} policies\n`)

    console.log('📊 Step 2: Getting table RLS status...')
    const tables = await getTableRLSStatus()
    console.log(`✅ Analyzed ${tables.length} tables\n`)

    console.log('📊 Step 3: Generating audit report...')
    const report = generateMarkdownReport(policies, tables)

    // Write to file
    const filename = 'RLS-POLICY-AUDIT.md'
    writeFileSync(filename, report)
    console.log(`✅ Report written to ${filename}\n`)

    // Output summary to console
    console.log('📋 Summary:')
    console.log(`   Total Policies: ${policies.length}`)
    console.log(`   Total Tables: ${tables.length}`)
    console.log(`   Tables with RLS: ${tables.filter((t) => t.rlsEnabled).length}`)
    console.log(`   Tables without RLS: ${tables.filter((t) => !t.rlsEnabled).length}`)

    console.log('\n✅ RLS policy extraction complete!')
    console.log(`📄 Review the full report in ${filename}`)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
