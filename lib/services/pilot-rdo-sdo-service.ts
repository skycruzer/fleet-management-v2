/**
 * Pilot Portal RDO/SDO Request Service
 *
 * @author Maurice Rondeau
 * @date January 19, 2025
 * @version 3.0.0 - 3-table architecture
 *
 * Pilot-facing service layer for RDO/SDO request operations.
 * Provides simplified, permission-safe wrappers around core rdo-sdo-service.
 *
 * Features:
 * - Auto-fills pilot_id from authenticated session
 * - Enforces pilot ownership on all operations
 * - Simplified error handling for pilot portal
 * - Cancel operations set status to WITHDRAWN (preserves audit trail)
 */

import { createClient } from '@/lib/supabase/server'
import {
  createRdoSdoRequest,
  getRdoSdoRequests,
  getRdoSdoRequestById,
  cancelRdoSdoRequest,
  type RdoSdoRequest,
  type CreateRdoSdoRequestInput,
} from './rdo-sdo-service'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface PilotRdoSdoRequestInput {
  request_type: 'RDO' | 'SDO'
  start_date: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD (optional, defaults to start_date)
  reason?: string
}

/**
 * Submit RDO/SDO Request (Pilot Self-Service)
 *
 * Allows authenticated pilot to submit an RDO or SDO request for themselves.
 * Automatically:
 * - Sets pilot_id to current authenticated pilot
 * - Sets submission_channel to 'PILOT_PORTAL'
 * - Calculates roster period from dates
 * - Adds denormalized fields (name, rank, employee_number)
 * - Validates no duplicate requests exist
 */
export async function submitPilotRdoSdoRequest(
  request: PilotRdoSdoRequestInput
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Prepare RDO/SDO request data
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table), NOT pilot.id (pilot_users table ID)
    const rdoSdoRequestData: CreateRdoSdoRequestInput = {
      pilot_id: pilot.pilot_id!,
      request_type: request.request_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
      submission_channel: 'PILOT_PORTAL',
    }

    // Create RDO/SDO request using core service
    const result = await createRdoSdoRequest(rdoSdoRequestData)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to create RDO/SDO request',
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Submit pilot RDO/SDO request error:', error)
    return {
      success: false,
      error: 'Failed to create RDO/SDO request',
    }
  }
}

/**
 * Get Current Pilot's RDO/SDO Requests
 *
 * Retrieves all RDO/SDO requests for the authenticated pilot.
 * Sorted by created_at descending (newest first).
 */
export async function getCurrentPilotRdoSdoRequests(): Promise<
  ServiceResponse<RdoSdoRequest[]>
> {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get RDO/SDO requests for this pilot
    const result = await getRdoSdoRequests(pilot.pilot_id!)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch RDO/SDO requests',
      }
    }

    return {
      success: true,
      data: result.data || [],
    }
  } catch (error) {
    console.error('Get current pilot RDO/SDO requests error:', error)
    return {
      success: false,
      error: 'Failed to fetch RDO/SDO requests',
    }
  }
}

/**
 * Get Single RDO/SDO Request (with ownership check)
 *
 * Retrieves a single RDO/SDO request by ID.
 * Verifies the request belongs to the authenticated pilot.
 */
export async function getPilotRdoSdoRequest(
  requestId: string
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get request by ID
    const result = await getRdoSdoRequestById(requestId)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'RDO/SDO request not found',
      }
    }

    // Verify ownership
    if (result.data.pilot_id !== pilot.pilot_id) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Get pilot RDO/SDO request error:', error)
    return {
      success: false,
      error: 'Failed to fetch RDO/SDO request',
    }
  }
}

/**
 * Cancel Pilot RDO/SDO Request
 *
 * Allows pilot to cancel their own SUBMITTED, IN_REVIEW, or APPROVED RDO/SDO requests.
 * Sets status to WITHDRAWN (preserves audit trail).
 *
 * IMPORTANT: Pilots can cancel approved requests (operational flexibility).
 */
export async function cancelPilotRdoSdoRequest(
  requestId: string
): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify request belongs to pilot
    const { data: request, error: fetchError } = await supabase
      .from('rdo_sdo_requests')
      .select('id, pilot_id, workflow_status, request_type, start_date')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: 'RDO/SDO request not found',
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
        error: 'This RDO/SDO request cannot be cancelled',
      }
    }

    // Cancel request (sets status to WITHDRAWN)
    const result = await cancelRdoSdoRequest(requestId)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to cancel RDO/SDO request',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Cancel pilot RDO/SDO request error:', error)
    return {
      success: false,
      error: 'Failed to cancel RDO/SDO request',
    }
  }
}

/**
 * Get Pilot RDO/SDO Request Statistics
 *
 * Retrieves RDO/SDO request statistics for the current pilot.
 */
export async function getPilotRdoSdoStats(): Promise<
  ServiceResponse<{
    total: number
    submitted: number
    in_review: number
    approved: number
    denied: number
    withdrawn: number
    byType: {
      RDO: number
      SDO: number
    }
  }>
> {
  try {
    const supabase = await createClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get counts by status and type from rdo_sdo_requests table
    const { data: requests, error } = await supabase
      .from('rdo_sdo_requests')
      .select('workflow_status, request_type')
      .eq('pilot_id', pilot.pilot_id!)

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch RDO/SDO statistics',
      }
    }

    const stats = {
      total: requests?.length || 0,
      submitted: requests?.filter((r) => r.workflow_status === 'SUBMITTED').length || 0,
      in_review: requests?.filter((r) => r.workflow_status === 'IN_REVIEW').length || 0,
      approved: requests?.filter((r) => r.workflow_status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.workflow_status === 'DENIED').length || 0,
      withdrawn: requests?.filter((r) => r.workflow_status === 'WITHDRAWN').length || 0,
      byType: {
        RDO: requests?.filter((r) => r.request_type === 'RDO').length || 0,
        SDO: requests?.filter((r) => r.request_type === 'SDO').length || 0,
      },
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Get pilot RDO/SDO stats error:', error)
    return {
      success: false,
      error: 'Failed to fetch RDO/SDO statistics',
    }
  }
}
