/**
 * Flight Request Service (Admin)
 * Author: Maurice Rondeau
 *
 * Admin-facing service layer for flight request review and management.
 * Provides functions for admins to review, approve, and deny pilot flight requests.
 *
 * MIGRATED: Now uses unified pilot_requests table (request_category='FLIGHT')
 * Previously used deprecated flight_requests table
 *
 * @spec 001-missing-core-features (US3, T056)
 */

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from './audit-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import type { FlightRequestReviewInput } from '@/lib/validations/flight-request-schema'
import type { FlightRequest } from './pilot-flight-service'

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get All Flight Requests (Admin View)
 *
 * Retrieves all flight requests with pilot information.
 * Includes filters for status, date range, etc.
 * Sorted by created_at descending (newest first).
 *
 * MIGRATED: Uses pilot_requests table with request_category='FLIGHT'
 */
export async function getAllFlightRequests(filters?: {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
  pilot_id?: string
  start_date_from?: string
  start_date_to?: string
}): Promise<ServiceResponse<FlightRequest[]>> {
  try {
    const supabase = await createClient()

    // Check authentication (admin/manager only)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Build query - MIGRATED to pilot_requests table
    let query = supabase
      .from('pilot_requests')
      .select(
        `
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          role,
          employee_id
        )
      `
      )
      .eq('request_category', 'FLIGHT')
      .order('created_at', { ascending: false })

    // Apply filters - MIGRATED: status -> workflow_status
    if (filters?.status) {
      query = query.eq('workflow_status', filters.status)
    }
    if (filters?.pilot_id) {
      query = query.eq('pilot_id', filters.pilot_id)
    }
    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }
    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Get all flight requests error:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    // Transform joined data
    const transformedRequests = (requests || []).map((req: any) => ({
      ...req,
      description: req.reason || req.notes || 'Flight request',
      pilot_name: req.pilots ? `${req.pilots.first_name} ${req.pilots.last_name}` : 'Unknown Pilot',
      pilot_rank: req.pilots?.role || 'Unknown',
      reviewer_name: undefined, // Reviewer info not joined (no FK relationship)
    }))

    return {
      success: true,
      data: transformedRequests as FlightRequest[],
    }
  } catch (error) {
    console.error('Get all flight requests error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
    }
  }
}

/**
 * Get Flight Request by ID (Admin View)
 *
 * Retrieves a single flight request with full details.
 *
 * MIGRATED: Uses pilot_requests table with request_category='FLIGHT'
 */
export async function getFlightRequestById(
  requestId: string
): Promise<ServiceResponse<FlightRequest>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // MIGRATED to pilot_requests table
    const { data: request, error } = await supabase
      .from('pilot_requests')
      .select(
        `
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          role,
          employee_id
        )
      `
      )
      .eq('request_category', 'FLIGHT')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.NOT_FOUND.message,
      }
    }

    // Transform joined data
    const transformedRequest = {
      ...request,
      description: request.reason || request.notes || 'Flight request',
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.last_name}`
        : 'Unknown Pilot',
      pilot_rank: request.pilots?.role || 'Unknown',
      reviewer_name: undefined, // Reviewer info not joined (no FK relationship)
    }

    return {
      success: true,
      data: transformedRequest as FlightRequest,
    }
  } catch (error) {
    console.error('Get flight request by ID error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
    }
  }
}

/**
 * Review Flight Request (Admin Action)
 *
 * Allows admin to approve or deny a flight request.
 * Creates audit log and notification for the pilot.
 *
 * MIGRATED: Uses pilot_requests table with workflow_status field
 */
export async function reviewFlightRequest(
  requestId: string,
  reviewData: FlightRequestReviewInput
): Promise<ServiceResponse<FlightRequest>> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get existing request to verify it exists - MIGRATED to pilot_requests
    const { data: existingRequest, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('request_category', 'FLIGHT')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.NOT_FOUND.message,
      }
    }

    // Update request with review - MIGRATED: status -> workflow_status, review fields updated
    const { data: updatedRequest, error: updateError } = await supabase
      .from('pilot_requests')
      .update({
        workflow_status: reviewData.status,
        review_comments: reviewData.reviewer_comments || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('request_category', 'FLIGHT')
      .eq('id', requestId)
      .select()
      .single()

    if (updateError || !updatedRequest) {
      console.error('Update flight request error:', updateError)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.UPDATE_FAILED.message,
      }
    }

    // Create audit log - table name updated to pilot_requests
    await createAuditLog({
      action: 'UPDATE',
      tableName: 'pilot_requests',
      recordId: requestId,
      oldData: {
        workflow_status: existingRequest.workflow_status,
        review_comments: existingRequest.review_comments,
      },
      newData: {
        workflow_status: reviewData.status,
        review_comments: reviewData.reviewer_comments,
      },
      description: `Flight request ${reviewData.status.toLowerCase()} (request_category=FLIGHT)`,
    })

    // Add description field for type compatibility
    const responseData = {
      ...updatedRequest,
      description: updatedRequest.reason || updatedRequest.notes || 'Flight request',
    }

    return {
      success: true,
      data: responseData as FlightRequest,
    }
  } catch (error) {
    console.error('Review flight request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.UPDATE_FAILED.message,
    }
  }
}

/**
 * Get Flight Request Statistics (Admin Dashboard)
 *
 * Retrieves aggregated statistics for all flight requests.
 *
 * MIGRATED: Uses pilot_requests table with request_category='FLIGHT'
 */
export async function getFlightRequestStats(): Promise<
  ServiceResponse<{
    total: number
    pending: number
    under_review: number
    approved: number
    denied: number
    by_type: {
      additional_flight: number
      route_change: number
      schedule_swap: number
      other: number
    }
  }>
> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get all flight requests - MIGRATED to pilot_requests with request_category filter
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('workflow_status, request_type')
      .eq('request_category', 'FLIGHT')

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    // MIGRATED: status -> workflow_status in aggregations
    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter((r) => r.workflow_status === 'PENDING').length || 0,
      under_review: requests?.filter((r) => r.workflow_status === 'UNDER_REVIEW').length || 0,
      approved: requests?.filter((r) => r.workflow_status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.workflow_status === 'DENIED').length || 0,
      by_type: {
        additional_flight:
          requests?.filter((r) => r.request_type === 'additional_flight').length || 0,
        route_change: requests?.filter((r) => r.request_type === 'route_change').length || 0,
        schedule_swap: requests?.filter((r) => r.request_type === 'schedule_swap').length || 0,
        other: requests?.filter((r) => r.request_type === 'other').length || 0,
      },
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Get flight request stats error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
    }
  }
}
