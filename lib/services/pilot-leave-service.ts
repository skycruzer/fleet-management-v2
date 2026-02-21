/**
 * Pilot Portal Leave Request Service
 *
 * @author Maurice Rondeau
 * Pilot-facing service layer for leave request operations.
 * Provides simplified, permission-safe wrappers around core leave service.
 *
 * @version 4.0.0 - UNIFIED TABLE (Sprint 1.1 - Nov 2025)
 * @spec 001-missing-core-features (US2)
 *
 * MIGRATION NOTE (Nov 20, 2025 - Sprint 1.1):
 * ============================================
 * ✅ Migrated from leave_requests → pilot_requests (request_category='LEAVE')
 * ✅ All database queries updated to use unified pilot_requests table
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  createLeaveRequestServer,
  deleteLeaveRequest,
  type LeaveRequest,
} from './unified-request-service'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { getTodayISO, type PilotLeaveRequestOutput } from '@/lib/validations/pilot-leave-schema'
import {
  getRosterPeriodCodeFromDate,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
} from '@/lib/services/roster-period-service'
import { sendRequestLifecycleEmail } from '@/lib/services/pilot-email-service'

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit Leave Request (Pilot Self-Service)
 *
 * Allows authenticated pilot to submit a leave request for themselves.
 * Automatically:
 * - Sets pilot_id to current authenticated pilot
 * - Sets request_date to today
 * - Sets submission_channel to 'SYSTEM'
 * - Calculates is_late_request flag
 * - Adds denormalized fields (name, rank, employee_number)
 */
export async function submitPilotLeaveRequest(
  request: PilotLeaveRequestOutput
): Promise<ServiceResponse<LeaveRequest>> {
  try {
    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Fetch pilot details from pilots table for denormalized fields
    // These fields are required for the pilot_requests table and admin display
    const supabase = createServiceRoleClient()
    const { data: pilotDetails, error: pilotError } = await supabase
      .from('pilots')
      .select('first_name, last_name, role, employee_id')
      .eq('id', pilot.pilot_id!)
      .single()

    if (pilotError || !pilotDetails) {
      console.error('Failed to fetch pilot details:', pilotError)
      return {
        success: false,
        error: 'Unable to fetch pilot details',
      }
    }

    // Prepare leave request data with denormalized pilot fields
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table), NOT pilot.id (pilot_users table ID)
    // Database uses DATE type for start_date/end_date, so send YYYY-MM-DD format only
    const leaveRequestData = {
      pilot_id: pilot.pilot_id!,
      name: `${pilotDetails.first_name} ${pilotDetails.last_name}`,
      rank: (pilotDetails.role as 'Captain' | 'First Officer') || 'Captain',
      employee_number: pilotDetails.employee_id || '',
      request_type: request.request_type as
        | 'ANNUAL'
        | 'SICK'
        | 'LSL'
        | 'LWOP'
        | 'MATERNITY'
        | 'COMPASSIONATE',
      start_date: request.start_date, // Send as YYYY-MM-DD (DATE type in database)
      end_date: request.end_date, // Send as YYYY-MM-DD (DATE type in database)
      request_date: getTodayISO(),
      request_method: 'PILOT_PORTAL' as const, // Pilot portal submission
      submission_channel: 'PILOT_PORTAL' as const,
      reason: request.reason || undefined,
      // Note: is_late_request is calculated server-side by createPilotRequest()
      // using submission_date vs roster period start date
      // Medical certificate attachment URL (optional, only for SICK leave)
      source_attachment_url: request.source_attachment_url || undefined,
    }

    // Create leave request using core service
    const result = await createLeaveRequestServer(leaveRequestData)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || ERROR_MESSAGES.LEAVE.CREATE_FAILED.message,
      }
    }

    // Email confirmation is already sent by createPilotRequest() in unified-request-service.ts
    // (via sendRequestLifecycleEmail). No need to send again here.

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Submit pilot leave request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.LEAVE.CREATE_FAILED.message,
    }
  }
}

/**
 * Get Current Pilot's Leave Requests
 *
 * Retrieves all leave requests for the authenticated pilot.
 * Sorted by request_date descending (newest first).
 */
export async function getCurrentPilotLeaveRequests(): Promise<ServiceResponse<LeaveRequest[]>> {
  try {
    const supabase = createServiceRoleClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Query leave requests from pilot_requests table (unified table)
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('request_category', 'LEAVE')
      .eq('pilot_id', pilot.pilot_id!)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch leave requests error:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message,
      }
    }

    return {
      success: true,
      data: (requests || []) as LeaveRequest[],
    }
  } catch (error) {
    console.error('Get current pilot leave requests error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message,
    }
  }
}

/**
 * Update Pilot Leave Request
 *
 * Allows pilot to update their own SUBMITTED or IN_REVIEW leave requests.
 * Cannot update APPROVED, DENIED, or WITHDRAWN requests.
 */
export async function updatePilotLeaveRequest(
  requestId: string,
  updates: PilotLeaveRequestOutput
): Promise<ServiceResponse<LeaveRequest>> {
  try {
    const supabase = createServiceRoleClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify request belongs to pilot and is editable
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id, workflow_status, request_category, submission_date')
      .eq('id', requestId)
      .eq('request_category', 'LEAVE')
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.NOT_FOUND.message,
      }
    }

    // Check ownership
    if (request.pilot_id !== pilot.pilot_id) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
      }
    }

    // Check if editable (can only edit SUBMITTED or IN_REVIEW)
    if (!['SUBMITTED', 'IN_REVIEW'].includes(request.workflow_status)) {
      return {
        success: false,
        error: 'Can only edit submitted or in-review requests. This request has been finalized.',
      }
    }

    // Recalculate is_late_request using ORIGINAL submission_date vs roster period start
    // Business rule: late = submission_date < 21 days before roster period commencement
    let lateRequestFlag = false
    const newStartDate = new Date(updates.start_date)
    if (!isNaN(newStartDate.getTime())) {
      const rpCode = getRosterPeriodCodeFromDate(newStartDate)
      const parsed = parseRosterPeriodCode(rpCode)
      if (parsed) {
        const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)
        const originalSubmission = request.submission_date
          ? new Date(request.submission_date)
          : new Date()
        const daysUntilRosterStart = Math.ceil(
          (rosterPeriod.startDate.getTime() - originalSubmission.getTime()) / (1000 * 60 * 60 * 24)
        )
        lateRequestFlag = daysUntilRosterStart < 21
      }
    }

    // Prepare update data
    const updateData = {
      request_type: updates.request_type,
      start_date: updates.start_date,
      end_date: updates.end_date,
      reason: updates.reason || null,
      is_late_request: lateRequestFlag,
      updated_at: new Date().toISOString(),
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('pilot_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('request_category', 'LEAVE')
      .select()
      .single()

    if (updateError || !updatedRequest) {
      console.error('Update leave request error:', updateError)
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.UPDATE_FAILED.message,
      }
    }

    // Send email notification about the edit (fire-and-forget)
    sendRequestLifecycleEmail(pilot.pilot_id!, 'edited', {
      requestCategory: 'LEAVE',
      requestType: updates.request_type,
      startDate: updates.start_date,
      endDate: updates.end_date || null,
      reason: updates.reason || null,
    }).catch((err: unknown) => console.error('Failed to send leave edit email:', err))

    return {
      success: true,
      data: updatedRequest as LeaveRequest,
    }
  } catch (error) {
    console.error('Update pilot leave request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.LEAVE.UPDATE_FAILED.message,
    }
  }
}

/**
 * Cancel Pilot Leave Request
 *
 * Allows pilot to cancel their own SUBMITTED, IN_REVIEW, or APPROVED leave requests.
 * Sets status to WITHDRAWN (preserves audit trail).
 */
export async function cancelPilotLeaveRequest(requestId: string): Promise<ServiceResponse> {
  try {
    const supabase = createAdminClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify request belongs to pilot
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id, workflow_status, request_type, start_date, end_date')
      .eq('id', requestId)
      .eq('request_category', 'LEAVE')
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.NOT_FOUND.message,
      }
    }

    // Check ownership
    // IMPORTANT: Compare with pilot.pilot_id (foreign key to pilots table)
    if (request.pilot_id !== pilot.pilot_id) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
      }
    }

    // Check if cancellable (can cancel SUBMITTED, IN_REVIEW, or APPROVED)
    if (!['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(request.workflow_status)) {
      return {
        success: false,
        error: 'This leave request cannot be cancelled',
      }
    }

    // Update status to WITHDRAWN instead of deleting
    const { error: updateError } = await supabase
      .from('pilot_requests')
      .update({ workflow_status: 'WITHDRAWN' })
      .eq('id', requestId)
      .eq('request_category', 'LEAVE')

    if (updateError) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.UPDATE_FAILED.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Cancel pilot leave request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.LEAVE.DELETE_FAILED.message,
    }
  }
}

/**
 * Get Pilot Leave Request Statistics
 *
 * Retrieves leave request statistics for the current pilot.
 */
export async function getPilotLeaveStats(): Promise<
  ServiceResponse<{
    total: number
    submitted: number
    in_review: number
    approved: number
    denied: number
    withdrawn: number
  }>
> {
  try {
    const supabase = createAdminClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get counts by status from pilot_requests table (unified table)
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table)
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('workflow_status')
      .eq('request_category', 'LEAVE')
      .eq('pilot_id', pilot.pilot_id!)

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message,
      }
    }

    const stats = {
      total: requests?.length || 0,
      submitted: requests?.filter((r) => r.workflow_status === 'SUBMITTED').length || 0,
      in_review: requests?.filter((r) => r.workflow_status === 'IN_REVIEW').length || 0,
      approved: requests?.filter((r) => r.workflow_status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.workflow_status === 'DENIED').length || 0,
      withdrawn: requests?.filter((r) => r.workflow_status === 'WITHDRAWN').length || 0,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Get pilot leave stats error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message,
    }
  }
}
