/**
 * Migrate Leave Requests to Unified Pilot Requests Table
 *
 * Migrates existing leave_requests data to the new pilot_requests unified table.
 * Maps all fields appropriately and maintains data integrity.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Map leave request type to unified request type
 */
function mapLeaveType(type) {
  const typeMap = {
    'annual': 'ANNUAL',
    'sick': 'SICK',
    'lsl': 'LSL',
    'lwop': 'LWOP',
    'maternity': 'MATERNITY',
    'compassionate': 'COMPASSIONATE',
    'rdo': 'RDO',
    'sdo': 'SDO'
  }
  return typeMap[type?.toLowerCase()] || 'ANNUAL'
}

/**
 * Map leave status to workflow status
 */
function mapStatus(status) {
  const statusMap = {
    'pending': 'SUBMITTED',
    'approved': 'APPROVED',
    'rejected': 'DENIED',
    'denied': 'DENIED'
  }
  return statusMap[status?.toLowerCase()] || 'SUBMITTED'
}

/**
 * Map request method to submission channel
 */
function mapSubmissionChannel(requestMethod) {
  const channelMap = {
    'email': 'EMAIL',
    'oracle': 'ORACLE',
    'system': 'ADMIN_PORTAL',
    'pilot_portal': 'PILOT_PORTAL',
    'phone': 'PHONE'
  }
  return channelMap[requestMethod?.toLowerCase()] || 'EMAIL'
}

/**
 * Map request type to request category
 *
 * IMPORTANT: RDO and SDO are FLIGHT requests (roster/schedule related)
 * All other leave types are LEAVE requests
 */
function mapRequestCategory(type) {
  const flightTypes = ['rdo', 'sdo']
  return flightTypes.includes(type?.toLowerCase()) ? 'FLIGHT' : 'LEAVE'
}

async function migrateLeaveRequests() {
  console.log('=' .repeat(70))
  console.log('🔄 Migrating Leave & Flight Requests to Pilot Requests')
  console.log('=' .repeat(70))

  try {
    // First, clear any existing sample data in pilot_requests
    console.log('\n🧹 Clearing existing pilot_requests data...')
    const { error: deleteError } = await supabase
      .from('pilot_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.log(`   ⚠️  Warning: Could not clear pilot_requests: ${deleteError.message}`)
    } else {
      console.log('   ✅ Cleared pilot_requests table')
    }

    // Fetch all leave requests with pilot details
    console.log('\n📥 Fetching existing leave_requests...')
    const { data: leaveRequests, error: fetchError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        pilot:pilots!pilot_id (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          seniority_number
        )
      `)
      .order('created_at', { ascending: true })

    // Separately fetch roster periods for reference
    const { data: rosterPeriods } = await supabase
      .from('roster_periods')
      .select('code, start_date, publish_date, request_deadline_date')

    const periodMap = new Map(rosterPeriods?.map(p => [p.code, p]) || [])

    if (fetchError) {
      console.error(`   ❌ Error fetching leave_requests: ${fetchError.message}`)
      return
    }

    console.log(`   ✅ Found ${leaveRequests?.length || 0} leave requests\n`)

    if (!leaveRequests || leaveRequests.length === 0) {
      console.log('   ℹ️  No leave requests to migrate')
      return
    }

    // Migrate each leave request
    let successCount = 0
    let failCount = 0
    const errors = []

    for (const req of leaveRequests) {
      try {
        // Calculate days count
        const startDate = new Date(req.start_date)
        const endDate = new Date(req.end_date)
        const diffTime = endDate.getTime() - startDate.getTime()
        const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        // Get roster period details from map
        const rosterPeriodData = periodMap.get(req.roster_period)

        // Calculate is_late_request and is_past_deadline
        const today = new Date()
        const rosterStart = rosterPeriodData?.start_date ? new Date(rosterPeriodData.start_date) : new Date(req.start_date)
        const rosterDeadline = rosterPeriodData?.request_deadline_date ? new Date(rosterPeriodData.request_deadline_date) : new Date(req.start_date)

        const daysUntilRosterStart = Math.ceil((rosterStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isLateRequest = daysUntilRosterStart < 21
        const isPastDeadline = today > rosterDeadline

        // Build pilot_request record
        const pilotRequest = {
          // Identity
          pilot_id: req.pilot_id,
          pilot_user_id: null, // Not used in leave_requests, would need an_users lookup
          employee_number: req.pilot?.employee_id || 'UNKNOWN',
          rank: req.pilot?.role || 'First Officer',
          name: req.pilot ? `${req.pilot.first_name} ${req.pilot.last_name}` : 'Unknown',

          // Request Classification
          request_category: mapRequestCategory(req.request_type),
          request_type: mapLeaveType(req.request_type),

          // Submission Tracking
          submission_channel: mapSubmissionChannel(req.request_method),
          submission_date: req.created_at || new Date().toISOString(),
          submitted_by_admin_id: null,
          source_reference: null,
          source_attachment_url: null,

          // Date/Time Details
          start_date: req.start_date,
          end_date: req.end_date,
          days_count: daysCount,

          // Roster Period (required fields)
          roster_period: req.roster_period || 'RP1/2025',
          roster_period_start_date: rosterPeriodData?.start_date || req.start_date,
          roster_publish_date: rosterPeriodData?.publish_date || req.start_date,
          roster_deadline_date: rosterPeriodData?.request_deadline_date || req.start_date,

          // Workflow
          workflow_status: mapStatus(req.status),
          reviewed_by: null,
          reviewed_at: req.status === 'approved' || req.status === 'rejected' ? req.updated_at : null,
          review_comments: req.notes || null,

          // Metadata
          reason: req.notes || null,
          notes: req.admin_notes || null,
          is_late_request: isLateRequest,
          is_past_deadline: isPastDeadline,
          priority_score: req.pilot?.seniority_number || 999,

          // Timestamps
          created_at: req.created_at || new Date().toISOString(),
          updated_at: req.updated_at || new Date().toISOString()
        }

        // Insert into pilot_requests
        const { error: insertError } = await supabase
          .from('pilot_requests')
          .insert(pilotRequest)

        if (insertError) {
          failCount++
          errors.push({
            id: req.id,
            pilot: pilotRequest.name,
            error: insertError.message
          })
          console.log(`   ❌ Failed: ${pilotRequest.name} - ${insertError.message}`)
        } else {
          successCount++
          console.log(`   ✅ Migrated: ${pilotRequest.name} - ${pilotRequest.request_type} (${pilotRequest.roster_period})`)
        }
      } catch (error) {
        failCount++
        errors.push({
          id: req.id,
          pilot: req.pilot ? `${req.pilot.first_name} ${req.pilot.last_name}` : 'Unknown',
          error: error.message
        })
        console.log(`   ❌ Exception: ${error.message}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Migration Summary')
    console.log('='.repeat(70))
    console.log(`\n   📥 Total leave requests: ${leaveRequests.length}`)
    console.log(`   ✅ Successfully migrated: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)

    if (errors.length > 0) {
      console.log(`\n   ⚠️  Errors:`)
      errors.slice(0, 5).forEach(err => {
        console.log(`      - ${err.pilot}: ${err.error}`)
      })
      if (errors.length > 5) {
        console.log(`      ... and ${errors.length - 5} more errors`)
      }
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const { count: pilotRequestsCount } = await supabase
      .from('pilot_requests')
      .select('*', { count: 'exact', head: true })

    console.log(`   📊 Total pilot_requests now: ${pilotRequestsCount}`)

    console.log('\n' + '='.repeat(70))
    console.log('✅ Migration Complete!')
    console.log('='.repeat(70))
    console.log('\n💡 Next Steps:')
    console.log('   1. Reload: http://localhost:3000/dashboard/requests')
    console.log('   2. Verify your leave requests appear correctly')
    console.log('   3. Test filtering and status workflows\n')

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error)
    console.error(error.stack)
  }
}

migrateLeaveRequests().catch(console.error)
