#!/usr/bin/env node

/**
 * Deploy Performance Indexes Script
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Purpose: Safely deploy performance indexes to production database
 * Usage: node scripts/deploy-indexes.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deployIndexes() {
  console.log('🚀 Starting performance index deployment...\n')

  try {
    // Read migration file
    const migrationPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251104000001_add_performance_indexes.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded successfully')
    console.log(`   Path: ${migrationPath}\n`)

    // Check current indexes before deployment
    console.log('🔍 Checking existing indexes...')
    const { data: existingIndexes, error: checkError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname;
      `,
    })

    if (checkError) {
      console.warn('⚠️  Could not check existing indexes (this is okay)')
      console.warn(`   Reason: ${checkError.message}\n`)
    } else {
      console.log(`   Found ${existingIndexes?.length || 0} existing indexes\n`)
    }

    // Execute migration
    console.log('⚙️  Deploying indexes (this may take 30-60 seconds)...')
    const startTime = Date.now()

    // Split migration into individual statements for better error reporting
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))

    let successCount = 0
    let skipCount = 0

    for (const statement of statements) {
      // Skip comments and empty statements
      if (!statement || statement.startsWith('DO $$')) {
        continue
      }

      try {
        // For CREATE INDEX statements, we can check if they already exist
        if (statement.includes('CREATE INDEX IF NOT EXISTS')) {
          const { error } = await supabase.rpc('execute_sql', {
            query: statement + ';',
          })

          if (error) {
            // Check if error is because index already exists (which is fine)
            if (error.message.includes('already exists')) {
              skipCount++
              console.log(`   ⏭️  Index already exists (skipped)`)
            } else {
              throw error
            }
          } else {
            successCount++
            console.log(`   ✅ Index created successfully`)
          }
        } else if (statement.includes('ANALYZE')) {
          // Run ANALYZE statements separately
          const { error } = await supabase.rpc('execute_sql', {
            query: statement + ';',
          })
          if (error) {
            console.warn(`   ⚠️  ANALYZE failed (non-critical): ${error.message}`)
          } else {
            console.log(`   ✅ Statistics updated`)
          }
        }
      } catch (error) {
        console.error(`   ❌ Failed to execute statement:`)
        console.error(`      ${statement.substring(0, 100)}...`)
        console.error(`      Error: ${error.message}`)
        throw error
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n⏱️  Deployment completed in ${duration}s`)
    console.log(`   Created: ${successCount} new indexes`)
    console.log(`   Skipped: ${skipCount} existing indexes`)

    // Verify indexes were created
    console.log('\n🔍 Verifying new indexes...')
    const { data: newIndexes, error: verifyError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%'
          AND indexname IN (
            'idx_leave_requests_rank_dates',
            'idx_pilots_seniority_role',
            'idx_pilot_checks_expiry_pilot',
            'idx_flight_requests_pending',
            'idx_leave_requests_pending',
            'idx_pilots_active',
            'idx_pilot_checks_pilot_date',
            'idx_leave_requests_dates'
          )
        ORDER BY tablename, indexname;
      `,
    })

    if (verifyError) {
      console.warn('⚠️  Could not verify indexes')
      console.warn(`   Reason: ${verifyError.message}`)
    } else {
      console.log(`   ✅ Verified ${newIndexes?.length || 0} performance indexes\n`)

      if (newIndexes && newIndexes.length > 0) {
        console.log('📋 Deployed indexes:')
        newIndexes.forEach((idx) => {
          console.log(`   • ${idx.indexname} on ${idx.tablename}`)
        })
      }
    }

    console.log('\n✅ Index deployment completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Run EXPLAIN ANALYZE on slow queries to verify index usage')
    console.log('   2. Monitor query performance in Supabase dashboard')
    console.log('   3. Check for query plan improvements\n')
  } catch (error) {
    console.error('\n❌ Index deployment failed!')
    console.error(`   Error: ${error.message}`)
    if (error.stack) {
      console.error(`\n   Stack trace:`)
      console.error(`   ${error.stack}`)
    }
    process.exit(1)
  }
}

// Run deployment
deployIndexes()
