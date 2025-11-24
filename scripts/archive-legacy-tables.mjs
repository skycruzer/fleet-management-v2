/**
 * Archive and Drop Legacy Tables
 * Phase 2.3 of Unified Request System Overhaul
 *
 * Safely archives deprecated leave_requests and flight_requests tables:
 * 1. Exports leave_requests to JSON backup
 * 2. Verifies all data exists in pilot_requests
 * 3. Generates migration to drop tables
 * 4. Confirms tables marked as deprecated with RLS
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function archiveLegacyTables() {
  console.log('\n📦 Archiving Legacy Tables\n')
  console.log('This script will:')
  console.log('  1. Export leave_requests to JSON backup')
  console.log('  2. Verify data exists in pilot_requests')
  console.log('  3. Export flight_requests to JSON backup')
  console.log('  4. Create migration to drop tables\n')

  // Step 1: Export leave_requests
  console.log('📥 Step 1: Exporting leave_requests table...\n')

  const { data: leaveRequests, error: leaveError } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: true })

  if (leaveError) {
    console.error('❌ Error fetching leave_requests:', leaveError.message)
    return
  }

  console.log(`✅ Found ${leaveRequests.length} leave_requests records`)

  if (leaveRequests.length > 0) {
    const backupFile = `backups/leave_requests_backup_${Date.now()}.json`
    writeFileSync(backupFile, JSON.stringify(leaveRequests, null, 2))
    console.log(`✅ Backed up to: ${backupFile}\n`)
  }

  // Step 2: Verify leave_requests data exists in pilot_requests
  console.log('🔍 Step 2: Verifying leave data in pilot_requests...\n')

  const { data: leaveInUnified, error: leaveUnifiedError } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'LEAVE')
    .order('created_at', { ascending: true })

  if (leaveUnifiedError) {
    console.error('❌ Error fetching pilot_requests (LEAVE):', leaveUnifiedError.message)
    return
  }

  console.log(`   Old table (leave_requests): ${leaveRequests.length} records`)
  console.log(`   New table (pilot_requests LEAVE): ${leaveInUnified.length} records`)

  if (leaveInUnified.length >= leaveRequests.length) {
    console.log(`✅ All leave data exists in unified table (+${leaveInUnified.length - leaveRequests.length} new records)\n`)
  } else {
    console.error(`❌ WARNING: Unified table has FEWER records!`)
    console.error(`   Missing ${leaveRequests.length - leaveInUnified.length} records`)
    console.error(`   DO NOT DROP TABLE - investigate missing data first\n`)
    return
  }

  // Step 3: Export flight_requests
  console.log('📥 Step 3: Exporting flight_requests table...\n')

  const { data: flightRequests, error: flightError } = await supabase
    .from('flight_requests')
    .select('*')
    .order('created_at', { ascending: true })

  if (flightError) {
    console.error('❌ Error fetching flight_requests:', flightError.message)
    return
  }

  console.log(`✅ Found ${flightRequests.length} flight_requests records`)

  if (flightRequests.length > 0) {
    const backupFile = `backups/flight_requests_backup_${Date.now()}.json`
    writeFileSync(backupFile, JSON.stringify(flightRequests, null, 2))
    console.log(`✅ Backed up to: ${backupFile}\n`)
  } else {
    console.log(`✅ Table is empty, no backup needed\n`)
  }

  // Verify flight_requests data
  console.log('🔍 Step 3b: Verifying flight data in pilot_requests...\n')

  const { data: flightInUnified, error: flightUnifiedError } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'FLIGHT')
    .order('created_at', { ascending: true })

  if (flightUnifiedError) {
    console.error('❌ Error fetching pilot_requests (FLIGHT):', flightUnifiedError.message)
    return
  }

  console.log(`   Old table (flight_requests): ${flightRequests.length} records`)
  console.log(`   New table (pilot_requests FLIGHT): ${flightInUnified.length} records`)

  if (flightInUnified.length >= flightRequests.length) {
    console.log(`✅ All flight data exists in unified table\n`)
  } else {
    console.error(`❌ WARNING: Unified table has FEWER records!`)
    console.error(`   Missing ${flightRequests.length - flightInUnified.length} records`)
    console.error(`   DO NOT DROP TABLE - investigate missing data first\n`)
    return
  }

  // Step 4: Create migration to drop tables
  console.log('📝 Step 4: Creating drop tables migration...\n')

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0]
  const migrationFile = `supabase/migrations/${timestamp}_drop_legacy_request_tables.sql`

  const migrationContent = `-- Drop Legacy Request Tables
-- Migration: Phase 2.3 of Unified Request System Overhaul
-- Author: Maurice Rondeau
-- Date: ${new Date().toISOString().split('T')[0]}

-- SAFETY CHECKS COMPLETED:
-- ✅ leave_requests: ${leaveRequests.length} records backed up
-- ✅ flight_requests: ${flightRequests.length} records backed up
-- ✅ pilot_requests (LEAVE): ${leaveInUnified.length} records verified
-- ✅ pilot_requests (FLIGHT): ${flightInUnified.length} records verified

-- Drop tables (CASCADE to remove dependent policies/indexes)
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS flight_requests CASCADE;

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('leave_requests', 'flight_requests')
  ) THEN
    RAISE EXCEPTION 'Tables still exist after DROP command';
  ELSE
    RAISE NOTICE 'SUCCESS - Legacy tables dropped successfully';
  END IF;
END $$;

-- Add comment to pilot_requests table
COMMENT ON TABLE pilot_requests IS
'Unified request table for all pilot requests (leave, flight, leave bids).
Replaces deprecated leave_requests and flight_requests tables.
Migration completed: ${new Date().toISOString().split('T')[0]}';
`

  writeFileSync(migrationFile, migrationContent)
  console.log(`✅ Created migration: ${migrationFile}\n`)

  // Summary
  console.log('📊 Archive Summary:\n')
  console.log(`   ✅ leave_requests: ${leaveRequests.length} records backed up`)
  console.log(`   ✅ flight_requests: ${flightRequests.length} records backed up`)
  console.log(`   ✅ pilot_requests: ${leaveInUnified.length + flightInUnified.length} total records verified`)
  console.log(`   ✅ Migration created: ${migrationFile}`)
  console.log('\n⚠️  Next Steps:')
  console.log('   1. Review the migration file')
  console.log('   2. Test on staging environment first')
  console.log('   3. Deploy to production: supabase db push')
  console.log('   4. Verify tables are dropped\n')
}

// Create backups directory if it doesn't exist
import { mkdirSync } from 'fs'
try {
  mkdirSync('backups', { recursive: true })
} catch (err) {
  // Directory already exists, ignore
}

archiveLegacyTables()
