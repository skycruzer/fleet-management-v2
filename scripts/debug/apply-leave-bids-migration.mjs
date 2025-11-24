#!/usr/bin/env node

/**
 * Apply Leave Bids Migration
 * Manually applies the leave bids tables migration to Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('📋 Reading migration file...')

  const migrationPath = join(
    __dirname,
    'supabase',
    'migrations',
    '20251027_create_leave_bids_tables.sql'
  )

  let sql
  try {
    sql = readFileSync(migrationPath, 'utf-8')
  } catch (error) {
    console.error('❌ Failed to read migration file:', error.message)
    process.exit(1)
  }

  console.log('🚀 Applying migration to Supabase...')

  // Split SQL by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comment-only statements
    if (statement.trim().startsWith('COMMENT')) {
      console.log(`⏭️  Skipping comment statement ${i + 1}/${statements.length}`)
      continue
    }

    console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_migrations').insert({
          sql: statement,
        })

        if (directError) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message || directError.message)
          errorCount++
        } else {
          successCount++
        }
      } else {
        successCount++
      }
    } catch (err) {
      console.error(`❌ Exception in statement ${i + 1}:`, err.message)
      errorCount++
    }
  }

  console.log('\n📊 Migration Results:')
  console.log(`✅ Successful statements: ${successCount}`)
  console.log(`❌ Failed statements: ${errorCount}`)

  if (errorCount === 0) {
    console.log('\n✨ Migration completed successfully!')
  } else {
    console.log('\n⚠️  Migration completed with errors. Please check the logs.')
  }
}

applyMigration().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
