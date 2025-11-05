/**
 * Apply RLS fix directly to database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgdmgvonqysflwdiiols.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required to apply migrations')
  console.error('Please set it in .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('Reading migration file...')

  const sql = readFileSync('./supabase/migrations/20251030_fix_an_users_rls_recursion.sql', 'utf8')

  console.log('\nApplying RLS fix to database...')
  console.log('This will fix the infinite recursion on an_users table.\n')

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

  console.log(`Executing ${statements.length} SQL statements...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim().length === 0) {
      continue
    }

    console.log(`\n[${i + 1}/${statements.length}] Executing...`)
    console.log(statement.substring(0, 80) + (statement.length > 80 ? '...' : ''))

    try {
      // Use raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      if (error) {
        // If exec_sql doesn't exist, try direct execution via REST API
        if (error.message.includes('Could not find the function')) {
          console.log('   Using alternative execution method...')

          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: statement + ';' })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`   ❌ Error: ${response.status} - ${errorText}`)
            continue
          }

          console.log('   ✅ Success')
        } else {
          console.error(`   ❌ Error: ${error.message}`)
          continue
        }
      } else {
        console.log('   ✅ Success')
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('Migration complete!')
  console.log('='.repeat(80))
  console.log('\nNOTE: Since direct SQL execution may not be available,')
  console.log('you may need to run the SQL manually in Supabase SQL Editor.')
  console.log('\nFile: ./supabase/migrations/20251030_fix_an_users_rls_recursion.sql')
}

main().catch(console.error)
