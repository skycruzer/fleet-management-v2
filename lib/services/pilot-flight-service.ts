/**
 * Pilot Portal Flight Request Service
 *
 * Pilot-facing service layer for flight request operations.
 * Allows pilots to request additional flights, route changes, and schedule swaps.
 *
 * @author Maurice Rondeau
 * @date November 13, 2025
 * @spec 001-missing-core-features (US3)
 *
 * MIGRATION NOTE: Migrated from deprecated flight_requests table to unified pilot_requests table.
 * All flight requests now use request_category='FLIGHT' and workflow_status instead of status.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import {
  getRosterPeriodCodeFromDate,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
} from '@/lib/services/roster-period-service'
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
  request_type: 'FLIGHT_REQUEST' | 'RDO' | 'SDO' | 'OFFICE_DAY'
  flight_date: string
  description: string
  reason?: string | null
  workflow_status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED'
  review_comments?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at?: string | null
  // Denormalized fields from unified pilot_requests table
  name?: string
  rank?: string
  employee_number?: string
  roster_period?: string
  submission_channel?: string
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
 * - Sets workflow_status to SUBMITTED
 * - Populates denormalized fields (name, rank, employee_number)
 * - Calculates roster period from flight_date
 * - Sets submission_channel to PORTAL
 * - Creates notification
 */
export async function submitPilotFlightRequest(
  request: FlightRequestInput
): Promise<ServiceResponse<FlightRequest>> {
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

    // Fetch full pilot details from pilots table for denormalized fields
    const { data: pilotDetails, error: pilotError } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role')
      .eq('id', pilot.pilot_id!)
      .single()

    if (pilotError || !pilotDetails) {
      console.error('Failed to fetch pilot details:', pilotError)
      return {
        success: false,
        error: 'Unable to retrieve pilot information. Please try again.',
      }
    }

    // Calculate roster period from flight_date
    const flightDate = new Date(request.flight_date)
    if (isNaN(flightDate.getTime())) {
      return {
        success: false,
        error: 'Invalid flight date format',
      }
    }

    const rosterPeriodCode = getRosterPeriodCodeFromDate(flightDate)
    const parsed = parseRosterPeriodCode(rosterPeriodCode)
    if (!parsed) {
      return {
        success: false,
        error: 'Unable to calculate roster period for the selected flight date',
      }
    }

    const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Prepare flight request data for unified pilot_requests table
    const flightRequestData = {
      // Core pilot identification
      pilot_id: pilotDetails.id,
      pilot_user_id: pilot.id,

      // Request classification
      request_category: 'FLIGHT' as const,
      request_type: request.request_type,
      submission_channel: 'PORTAL' as const,

      // Denormalized pilot data (for reporting performance)
      name: `${pilotDetails.first_name} ${pilotDetails.last_name}`.toUpperCase(),
      rank: pilotDetails.role,
      employee_number: pilotDetails.employee_id,

      // Request details (flight requests use flight_date for single-day operations)
      start_date: request.flight_date, // Use flight_date as start_date
      end_date: null, // Flight requests are single-day
      flight_date: request.flight_date,
      notes: request.description || null, // Map description to notes
      reason: request.reason || null,

      // Roster period calculations
      roster_period: rosterPeriodCode,
      roster_period_start_date: rosterPeriod.startDate.toISOString().split('T')[0],
      roster_publish_date: rosterPeriod.publishDate.toISOString().split('T')[0],
      roster_deadline_date: rosterPeriod.deadlineDate.toISOString().split('T')[0],

      // Workflow
      workflow_status: 'SUBMITTED' as const,
    }

    // Insert flight request into pilot_requests table
    const { data: createdRequest, error: insertError } = await supabase
      .from('pilot_requests')
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

    // Map back to FlightRequest interface for backward compatibility
    const mappedRequest: FlightRequest = {
      id: createdRequest.id,
      pilot_id: createdRequest.pilot_id!,
      pilot_user_id: createdRequest.pilot_user_id!,
      request_type: createdRequest.request_type as FlightRequest['request_type'],
      flight_date: createdRequest.flight_date!,
      description: createdRequest.notes || '',
      reason: createdRequest.reason,
      workflow_status: createdRequest.workflow_status as FlightRequest['workflow_status'],
      review_comments: createdRequest.review_comments,
      reviewed_by: createdRequest.reviewed_by,
      reviewed_at: createdRequest.reviewed_at,
      created_at: createdRequest.created_at!,
      updated_at: createdRequest.updated_at,
      name: createdRequest.name,
      rank: createdRequest.rank,
      employee_number: createdRequest.employee_number,
      roster_period: createdRequest.roster_period,
      submission_channel: createdRequest.submission_channel,
    }

    return {
      success: true,
      data: mappedRequest,
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
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Query flight requests from pilot_requests table with request_category filter
    // Use BOTH pilot_user_id AND pilot_id to catch all requests
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('request_category', 'FLIGHT')
      .or(`pilot_user_id.eq.${pilot.id},pilot_id.eq.${pilot.pilot_id || pilot.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get flight requests error:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    // Map to FlightRequest interface for backward compatibility
    const mappedRequests: FlightRequest[] = (requests || []).map((req) => ({
      id: req.id,
      pilot_id: req.pilot_id!,
      pilot_user_id: req.pilot_user_id!,
      request_type: req.request_type as FlightRequest['request_type'],
      flight_date: req.flight_date!,
      description: req.notes || '',
      reason: req.reason,
      workflow_status: req.workflow_status as FlightRequest['workflow_status'],
      review_comments: req.review_comments,
      reviewed_by: req.reviewed_by,
      reviewed_at: req.reviewed_at,
      created_at: req.created_at!,
      updated_at: req.updated_at,
      name: req.name,
      rank: req.rank,
      employee_number: req.employee_number,
      roster_period: req.roster_period,
      submission_channel: req.submission_channel,
    }))

    return {
      success: true,
      data: mappedRequests,
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
 * Allows pilot to cancel their own SUBMITTED flight requests.
 * Cannot cancel requests that are UNDER_REVIEW, APPROVED, or DENIED.
 */
export async function cancelPilotFlightRequest(requestId: string): Promise<ServiceResponse> {
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

    // Verify request belongs to pilot and is SUBMITTED
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id, workflow_status, request_type, flight_date, notes, request_category')
      .eq('id', requestId)
      .eq('request_category', 'FLIGHT')
      .single()

    if (fetchError || !request) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.NOT_FOUND.message,
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

    // Check if submitted (pilots can only cancel submitted requests)
    if (request.workflow_status !== 'SUBMITTED') {
      return {
        success: false,
        error: 'Can only cancel submitted requests. This request has already been reviewed or is under review.',
      }
    }

    // Delete request
    const { error: deleteError } = await supabase
      .from('pilot_requests')
      .delete()
      .eq('id', requestId)
      .eq('request_category', 'FLIGHT')

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
    submitted: number
    under_review: number
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

    // Get counts by workflow_status
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table)
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('workflow_status')
      .eq('request_category', 'FLIGHT')
      .eq('pilot_id', pilot.pilot_id!)

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    const stats = {
      total: requests?.length || 0,
      submitted: requests?.filter((r) => r.workflow_status === 'SUBMITTED').length || 0,
      under_review: requests?.filter((r) => r.workflow_status === 'UNDER_REVIEW').length || 0,
      approved: requests?.filter((r) => r.workflow_status === 'APPROVED').length || 0,
      denied: requests?.filter((r) => r.workflow_status === 'DENIED').length || 0,
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
