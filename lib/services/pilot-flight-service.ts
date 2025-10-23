/**
 * Pilot Portal Flight Request Service
 *
 * Pilot-facing service layer for flight request operations.
 * Allows pilots to request additional flights, route changes, and schedule swaps.
 *
 * @spec 001-missing-core-features (US3)
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from './pilot-portal-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import type { FlightRequestInput } from '@/lib/validations/flight-request-schema'

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface FlightRequest {
  id: string
  pilot_id: string
  pilot_user_id?: string
  request_type: 'ADDITIONAL_FLIGHT' | 'ROUTE_CHANGE' | 'SCHEDULE_SWAP' | 'OTHER'
  flight_date: string
  description: string
  reason?: string | null
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
  reviewer_comments?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at?: string | null
  // Joined data
  pilot_name?: string
  pilot_rank?: string
  reviewer_name?: string
}

/**
 * Submit Flight Request (Pilot Self-Service)
 *
 * Allows authenticated pilot to submit a flight request.
 * Automatically:
 * - Sets pilot_id to current authenticated pilot
 * - Sets status to PENDING
 * - Creates notification
 */
export async function submitPilotFlightRequest(
  request: FlightRequestInput
): Promise<ServiceResponse<FlightRequest>> {
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

    // Prepare flight request data
    const flightRequestData = {
      pilot_id: pilot.pilot_id || pilot.id,
      pilot_user_id: pilot.id,
      request_type: request.request_type,
      flight_date: request.flight_date,
      description: request.description,
      reason: request.reason || null,
      status: 'PENDING' as const,
    }

    // Insert flight request
    const { data: createdRequest, error: insertError } = await supabase
      .from('flight_requests')
      .insert(flightRequestData)
      .select()
      .single()

    if (insertError || !createdRequest) {
      console.error('Insert flight request error:', insertError)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.message,
      }
    }

    return {
      success: true,
      data: createdRequest as FlightRequest,
    }
  } catch (error) {
    console.error('Submit pilot flight request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.message,
    }
  }
}

/**
 * Get Current Pilot's Flight Requests
 *
 * Retrieves all flight requests for the authenticated pilot.
 * Sorted by created_at descending (newest first).
 */
export async function getCurrentPilotFlightRequests(): Promise<ServiceResponse<FlightRequest[]>> {
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

    // Query flight requests using BOTH pilot_user_id AND pilot_id to catch all requests
    // Some requests may be stored under pilot_user_id, others under pilot_id
    const { data: requests, error } = await supabase
      .from('flight_requests')
      .select('*')
      .or(`pilot_user_id.eq.${pilot.id},pilot_id.eq.${pilot.pilot_id || pilot.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get flight requests error:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    return {
      success: true,
      data: (requests as FlightRequest[]) || [],
    }
  } catch (error) {
    console.error('Get current pilot flight requests error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
    }
  }
}

/**
 * Cancel Pilot Flight Request
 *
 * Allows pilot to cancel their own PENDING flight requests.
 * Cannot cancel requests that are UNDER_REVIEW, APPROVED, or DENIED.
 */
export async function cancelPilotFlightRequest(requestId: string): Promise<ServiceResponse> {
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
      .from('flight_requests')
      .select('id, pilot_id, status, request_type, flight_date, description')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.NOT_FOUND.message,
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
        error: 'Can only cancel pending requests. This request has already been reviewed.',
      }
    }

    // Delete request
    const { error: deleteError } = await supabase
      .from('flight_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Delete flight request error:', deleteError)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Cancel pilot flight request error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.DELETE_FAILED.message,
    }
  }
}

/**
 * Get Pilot Flight Request Statistics
 *
 * Retrieves flight request statistics for the current pilot.
 */
export async function getPilotFlightStats(): Promise<
  ServiceResponse<{
    total: number
    pending: number
    under_review: number
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
      .from('flight_requests')
      .select('status')
      .eq('pilot_id', pilot.id)

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
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Get pilot flight stats error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
    }
  }
}
