/**
 * Migrate Legacy Requests to Unified System
 *
 * Migrates all leave_requests and flight_requests from legacy tables
 * to the new unified pilot_requests table.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

// Helper function to calculate days between dates
function calculateDaysCount(startDate, endDate) {
  if (!endDate) return 1
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

// Helper function to determine if request is late (less than 21 days advance notice)
function isLateRequest(startDate, requestDate) {
  const start = new Date(startDate)
  const requested = new Date(requestDate || new Date())
  const diffTime = start - requested
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays < 21
}

// Map legacy status to unified status
function mapStatus(legacyStatus) {
  const statusMap = {
    PENDING: 'SUBMITTED',
    APPROVED: 'APPROVED',
    DENIED: 'DENIED',
    REJECTED: 'DENIED',
    WITHDRAWN: 'WITHDRAWN',
    CANCELLED: 'WITHDRAWN',
  }
  return statusMap[legacyStatus] || 'SUBMITTED'
}

// Map legacy request method to submission channel
function mapSubmissionChannel(requestMethod) {
  const channelMap = {
    EMAIL: 'EMAIL',
    PHONE: 'PHONE',
    ORACLE: 'ORACLE',
    SYSTEM: 'ADMIN_PORTAL',
    PORTAL: 'PILOT_PORTAL',
  }
  return channelMap[requestMethod] || 'EMAIL'
}

async function migrateLeaveRequests() {
  console.log('\n📋 Migrating leave_requests to pilot_requests...\n')

  // Fetch all leave requests (without join to avoid ambiguity)
  const { data: leaveRequests, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch all pilots separately
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_id, role')

  const pilotsMap = new Map(pilots?.map((p) => [p.id, p]) || [])

  if (fetchError) {
    console.error('❌ Error fetching leave requests:', fetchError.message)
    return { migrated: 0, failed: 0 }
  }

  console.log(`   Found ${leaveRequests.length} leave requests to migrate`)

  let migratedCount = 0
  let failedCount = 0
  const failures = []

  for (const request of leaveRequests) {
    try {
      const pilot = request.pilots

      if (!pilot) {
        console.log(`   ⚠️  Skipping request ${request.id} - pilot not found`)
        failedCount++
        failures.push({ id: request.id, reason: 'Pilot not found' })
        continue
      }

      // Create unified request object
      const unifiedRequest = {
        pilot_id: request.pilot_id,
        employee_number: pilot.employee_id,
        rank: pilot.role,
        name: `${pilot.first_name} ${pilot.last_name}`,
        request_category: 'LEAVE',
        request_type: request.request_type,
        submission_channel: mapSubmissionChannel(request.request_method),
        start_date: request.start_date,
        end_date: request.end_date,
        roster_period: request.roster_period,
        workflow_status: mapStatus(request.status),
        days_count: request.days_count || calculateDaysCount(request.start_date, request.end_date),
        is_late_request:
          request.is_late_request || isLateRequest(request.start_date, request.request_date),
        reason: request.reason,
        notes: request.notes || request.review_comments,
        legacy_id: request.id,
        legacy_table: 'leave_requests',
        created_at: request.created_at,
        updated_at: request.updated_at,
      }

      // Insert into pilot_requests
      const { error: insertError } = await supabase.from('pilot_requests').insert(unifiedRequest)

      if (insertError) {
        console.log(`   ❌ Failed to migrate request ${request.id}:`, insertError.message)
        failedCount++
        failures.push({ id: request.id, reason: insertError.message })
      } else {
        migratedCount++
        console.log(
          `   ✅ Migrated ${request.request_type} request for ${pilot.first_name} ${pilot.last_name} (${request.roster_period})`
        )
      }
    } catch (error) {
      console.log(`   ❌ Error processing request ${request.id}:`, error.message)
      failedCount++
      failures.push({ id: request.id, reason: error.message })
    }
  }

  return { migrated: migratedCount, failed: failedCount, failures }
}

async function migrateFlightRequests() {
  console.log('\n✈️  Migrating flight_requests to pilot_requests...\n')

  // Fetch all flight requests (without join to avoid ambiguity)
  const { data: flightRequests, error: fetchError } = await supabase
    .from('flight_requests')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch all pilots separately
  const { data: pilots } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_id, role')

  const pilotsMap = new Map(pilots?.map((p) => [p.id, p]) || [])

  if (fetchError) {
    console.error('❌ Error fetching flight requests:', fetchError.message)
    return { migrated: 0, failed: 0 }
  }

  console.log(`   Found ${flightRequests.length} flight requests to migrate`)

  if (flightRequests.length === 0) {
    console.log('   ℹ️  No flight requests to migrate')
    return { migrated: 0, failed: 0 }
  }

  let migratedCount = 0
  let failedCount = 0
  const failures = []

  for (const request of flightRequests) {
    try {
      const pilot = pilotsMap.get(request.pilot_id)

      if (!pilot) {
        console.log(`   ⚠️  Skipping request ${request.id} - pilot not found`)
        failedCount++
        failures.push({ id: request.id, reason: 'Pilot not found' })
        continue
      }

      // Create unified request object
      const unifiedRequest = {
        pilot_id: request.pilot_id,
        employee_number: pilot.employee_id,
        rank: pilot.role,
        name: `${pilot.first_name} ${pilot.last_name}`,
        request_category: 'FLIGHT',
        request_type: request.request_type,
        submission_channel: mapSubmissionChannel(request.request_method || 'PORTAL'),
        start_date: request.flight_date,
        end_date: request.flight_date,
        flight_date: request.flight_date,
        roster_period: request.roster_period,
        workflow_status: mapStatus(request.status),
        days_count: 1,
        is_late_request: false,
        reason: request.reason,
        notes: request.description || request.notes,
        legacy_id: request.id,
        legacy_table: 'flight_requests',
        created_at: request.created_at,
        updated_at: request.updated_at,
      }

      // Insert into pilot_requests
      const { error: insertError } = await supabase.from('pilot_requests').insert(unifiedRequest)

      if (insertError) {
        console.log(`   ❌ Failed to migrate request ${request.id}:`, insertError.message)
        failedCount++
        failures.push({ id: request.id, reason: insertError.message })
      } else {
        migratedCount++
        console.log(
          `   ✅ Migrated ${request.request_type} request for ${pilot.first_name} ${pilot.last_name}`
        )
      }
    } catch (error) {
      console.log(`   ❌ Error processing request ${request.id}:`, error.message)
      failedCount++
      failures.push({ id: request.id, reason: error.message })
    }
  }

  return { migrated: migratedCount, failed: failedCount, failures }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n')

  // Count records in unified table
  const { count: unifiedCount } = await supabase
    .from('pilot_requests')
    .select('*', { count: 'exact', head: true })

  console.log(`   Total requests in pilot_requests: ${unifiedCount}`)

  // Count by category
  const { data: byCategory } = await supabase.from('pilot_requests').select('request_category')

  const categoryCounts = byCategory.reduce((acc, r) => {
    acc[r.request_category] = (acc[r.request_category] || 0) + 1
    return acc
  }, {})

  console.log('   By category:')
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`      ${category}: ${count}`)
  })

  // Count by type
  const { data: byType } = await supabase.from('pilot_requests').select('request_type')

  const typeCounts = byType.reduce((acc, r) => {
    acc[r.request_type] = (acc[r.request_type] || 0) + 1
    return acc
  }, {})

  console.log('   By type:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`      ${type}: ${count}`)
  })

  // Count RDO/SDO specifically
  const { data: rdoSdo } = await supabase
    .from('pilot_requests')
    .select('*')
    .or('request_type.eq.RDO,request_type.eq.SDO')

  console.log(`\n   ✅ RDO/SDO requests migrated: ${rdoSdo.length}`)
}

async function main() {
  console.log('='.repeat(70))
  console.log('🚀 Legacy Request Migration to Unified System')
  console.log('='.repeat(70))

  try {
    // Check if pilot_requests already has data
    const { count: existingCount } = await supabase
      .from('pilot_requests')
      .select('*', { count: 'exact', head: true })

    if (existingCount > 0) {
      console.log(`\n⚠️  Warning: pilot_requests table already has ${existingCount} records`)
      console.log('   This script will add to existing records (duplicates possible)')
      console.log('   Continue? (Ctrl+C to cancel, or wait 5 seconds to proceed)\n')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    // Migrate leave requests
    const leaveResults = await migrateLeaveRequests()

    // Migrate flight requests
    const flightResults = await migrateFlightRequests()

    // Verify migration
    await verifyMigration()

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Migration Summary')
    console.log('='.repeat(70))
    console.log(`\n   Leave Requests:`)
    console.log(`      ✅ Migrated: ${leaveResults.migrated}`)
    console.log(`      ❌ Failed: ${leaveResults.failed}`)
    console.log(`\n   Flight Requests:`)
    console.log(`      ✅ Migrated: ${flightResults.migrated}`)
    console.log(`      ❌ Failed: ${flightResults.failed}`)
    console.log(`\n   Total Migrated: ${leaveResults.migrated + flightResults.migrated}`)
    console.log(`   Total Failed: ${leaveResults.failed + flightResults.failed}`)

    if (leaveResults.failures.length > 0 || flightResults.failures.length > 0) {
      console.log('\n⚠️  Failed Migrations:')
      ;[...leaveResults.failures, ...flightResults.failures].forEach((f) => {
        console.log(`   - ${f.id}: ${f.reason}`)
      })
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Migration Complete!')
    console.log('='.repeat(70))
    console.log('\n💡 Next Steps:')
    console.log('   1. Verify data in unified dashboard: http://localhost:3000/dashboard/requests')
    console.log('   2. Test filtering by RDO/SDO request types')
    console.log('   3. Optionally archive legacy tables after verification')
    console.log('')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
