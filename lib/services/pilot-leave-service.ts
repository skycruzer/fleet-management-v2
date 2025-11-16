/**
 * Pilot Portal Leave Request Service
 *
 * @author Maurice Rondeau
 * Pilot-facing service layer for leave request operations.
 * Provides simplified, permission-safe wrappers around core leave service.
 *
 * @version 2.0.0 - Migrated to pilot_requests unified table
 * @spec 001-missing-core-features (US2)
 */

import { createClient } from '@/lib/supabase/server'
import {
  createLeaveRequestServer,
  deleteLeaveRequest,
  type LeaveRequest,
} from './leave-service'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import {
  isLateRequest,
  getTodayISO,
  type PilotLeaveRequestInput,
} from '@/lib/validations/pilot-leave-schema'

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
  request: PilotLeaveRequestInput
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

    // Prepare leave request data
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table), NOT pilot.id (pilot_users table ID)
    // Database uses DATE type for start_date/end_date, so send YYYY-MM-DD format only
    const leaveRequestData = {
      pilot_id: pilot.pilot_id!,
      request_type: request.request_type as
        | 'RDO'
        | 'SDO'
        | 'ANNUAL'
        | 'SICK'
        | 'LSL'
        | 'LWOP'
        | 'MATERNITY'
        | 'COMPASSIONATE',
      start_date: request.start_date, // Send as YYYY-MM-DD (DATE type in database)
      end_date: request.end_date, // Send as YYYY-MM-DD (DATE type in database)
      request_date: getTodayISO(),
      request_method: 'SYSTEM' as const, // Pilot portal submission
      submission_channel: 'SYSTEM' as const,
      reason: request.reason || undefined,
      is_late_request: isLateRequest(request.start_date),
    }

    // Create leave request using core service (which now handles denormalized fields)
    const createdRequest = await createLeaveRequestServer(leaveRequestData)

    if (!createdRequest) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.CREATE_FAILED.message,
      }
    }

    return {
      success: true,
      data: createdRequest,
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
    const supabase = await createClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Query leave requests from unified pilot_requests table
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
 * Cancel Pilot Leave Request
 *
 * Allows pilot to cancel their own PENDING leave requests.
 * Cannot cancel approved or denied requests.
 */
export async function cancelPilotLeaveRequest(requestId: string): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify request belongs to pilot and is PENDING
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id, workflow_status, request_type, start_date, end_date')
      .eq('request_category', 'LEAVE')
      .eq('id', requestId)
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

    // Check if pending
    if (request.workflow_status !== 'PENDING') {
      return {
        success: false,
        error: 'Only pending leave requests can be cancelled',
      }
    }

    // Delete request
    await deleteLeaveRequest(requestId)

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
    pending: number
    approved: number
    denied: number
  }>
> {
  try {
    const supabase = await createClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get counts by status from unified pilot_requests table
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
      pending: requests?.filter((r) => r.workflow_status === 'PENDING').length || 0,
      approved: requests?.filter((r) => r.workflow_status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.workflow_status === 'DENIED').length || 0,
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
