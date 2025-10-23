/**
 * Pilot Portal Leave Request Service
 *
 * Pilot-facing service layer for leave request operations.
 * Provides simplified, permission-safe wrappers around core leave service.
 *
 * @spec 001-missing-core-features (US2)
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  createLeaveRequestServer,
  deleteLeaveRequest,
  type LeaveRequest,
} from './leave-service'
import { getCurrentPilot } from './pilot-portal-service'
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
 * - Sets request_method to 'SYSTEM'
 * - Calculates is_late_request flag
 */
export async function submitPilotLeaveRequest(
  request: PilotLeaveRequestInput
): Promise<ServiceResponse<LeaveRequest>> {
  try {
    // Get current pilot
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const pilot = pilotResult.data

    // Prepare leave request data
    const leaveRequestData = {
      pilot_id: pilot.id,
      request_type: request.request_type as
        | 'RDO'
        | 'SDO'
        | 'ANNUAL'
        | 'SICK'
        | 'LSL'
        | 'LWOP'
        | 'MATERNITY'
        | 'COMPASSIONATE',
      start_date: `${request.start_date}T00:00:00.000Z`, // Convert to ISO datetime
      end_date: `${request.end_date}T23:59:59.999Z`, // Convert to ISO datetime
      request_date: getTodayISO(),
      request_method: 'SYSTEM' as const,
      reason: request.reason || undefined,
      is_late_request: isLateRequest(request.start_date),
    }

    // Create leave request using core service
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
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const pilot = pilotResult.data

    // Query leave requests using BOTH pilot_user_id AND pilot_id to catch all requests
    // Some requests may be stored under pilot_user_id, others under pilot_id
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('*')
      .or(`pilot_user_id.eq.${pilot.id},pilot_id.eq.${pilot.pilot_id || pilot.id}`)
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
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const pilot = pilotResult.data

    // Verify request belongs to pilot and is PENDING
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('id, pilot_id, status, request_type, start_date, end_date')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.NOT_FOUND.message,
      }
    }

    // Check ownership
    if (request.pilot_id !== pilot.id) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
      }
    }

    // Check if pending
    if (request.status !== 'PENDING') {
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
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const pilot = pilotResult.data

    // Get counts by status
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('status')
      .eq('pilot_id', pilot.id)

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.LEAVE.FETCH_FAILED.message,
      }
    }

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter((r) => r.status === 'PENDING').length || 0,
      approved: requests?.filter((r) => r.status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.status === 'DENIED').length || 0,
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
