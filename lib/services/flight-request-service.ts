/**
 * Flight Request Service (Admin)
 *
 * Admin-facing service layer for flight request review and management.
 * Provides functions for admins to review, approve, and deny pilot flight requests.
 *
 * @spec 001-missing-core-features (US3, T056)
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from './audit-service'
import { notifyFlightApproved, notifyFlightDenied } from './pilot-notification-service'
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

    // Build query
    let query = supabase
      .from('flight_requests')
      .select(`
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          role,
          employee_id
        ),
        an_users:reviewed_by (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
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
      pilot_name: req.pilots
        ? `${req.pilots.first_name} ${req.pilots.last_name}`
        : 'Unknown Pilot',
      pilot_rank: req.pilots?.role || 'Unknown',
      reviewer_name: req.an_users
        ? `${req.an_users.first_name} ${req.an_users.last_name}`
        : null,
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

    const { data: request, error } = await supabase
      .from('flight_requests')
      .select(`
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          role,
          employee_id
        ),
        an_users:reviewed_by (
          id,
          first_name,
          last_name
        )
      `)
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
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.last_name}`
        : 'Unknown Pilot',
      pilot_rank: request.pilots?.role || 'Unknown',
      reviewer_name: request.an_users
        ? `${request.an_users.first_name} ${request.an_users.last_name}`
        : null,
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

    // Get existing request to verify it exists
    const { data: existingRequest, error: fetchError } = await supabase
      .from('flight_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.NOT_FOUND.message,
      }
    }

    // Update request with review
    const { data: updatedRequest, error: updateError } = await supabase
      .from('flight_requests')
      .update({
        status: reviewData.status,
        admin_comments: reviewData.admin_comments || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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

    // Create audit log
    await createAuditLog({
      user_id: user.id,
      action: 'UPDATE',
      table_name: 'flight_requests',
      record_id: requestId,
      old_values: {
        status: existingRequest.status,
        admin_comments: existingRequest.admin_comments,
      },
      new_values: {
        status: reviewData.status,
        admin_comments: reviewData.admin_comments,
      },
      description: `Flight request ${reviewData.status.toLowerCase()}`,
    })

    // Send notification to pilot
    if (reviewData.status === 'APPROVED') {
      await notifyFlightApproved(
        existingRequest.pilot_id,
        existingRequest.request_type.replace('_', ' '),
        existingRequest.route,
        reviewData.admin_comments
      )
    } else if (reviewData.status === 'DENIED') {
      await notifyFlightDenied(
        existingRequest.pilot_id,
        existingRequest.request_type.replace('_', ' '),
        existingRequest.route,
        reviewData.admin_comments
      )
    }

    return {
      success: true,
      data: updatedRequest as FlightRequest,
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
 */
export async function getFlightRequestStats(): Promise<ServiceResponse<{
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
}>> {
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

    // Get all requests
    const { data: requests, error } = await supabase
      .from('flight_requests')
      .select('status, request_type')

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter((r) => r.status === 'PENDING').length || 0,
      under_review: requests?.filter((r) => r.status === 'UNDER_REVIEW').length || 0,
      approved: requests?.filter((r) => r.status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.status === 'DENIED').length || 0,
      by_type: {
        additional_flight: requests?.filter((r) => r.request_type === 'additional_flight').length || 0,
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
