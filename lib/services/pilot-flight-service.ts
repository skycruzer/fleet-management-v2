/**
 * Pilot Portal RDO/SDO Request Service
 *
 * Pilot-facing service layer for RDO/SDO request operations.
 * Allows pilots to request Rostered Days Off (RDO) and Scheduled Days Off (SDO).
 *
 * @author Maurice Rondeau
 * @date November 20, 2025
 * @spec 001-missing-core-features (US3)
 *
 * MIGRATION NOTE: Migrated from deprecated flight_requests table to unified pilot_requests table.
 * All RDO/SDO requests now use request_category='FLIGHT' and workflow_status instead of status.
 * Supports single-day (start_date only) and multi-day requests (start_date + end_date).
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
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
  request_type: 'RDO' | 'SDO'
  start_date: string
  end_date?: string | null
  description?: string | null
  reason?: string | null
  workflow_status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
  review_comments?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at?: string | null
  is_late_request?: boolean | null
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
 * Submit RDO/SDO Request (Pilot Self-Service)
 *
 * Allows authenticated pilot to submit an RDO/SDO request.
 * Supports both single-day (start_date only) and multi-day requests (start_date + end_date).
 * Automatically:
 * - Sets pilot_id to current authenticated pilot
 * - Sets workflow_status to SUBMITTED
 * - Populates denormalized fields (name, rank, employee_number)
 * - Calculates roster period from start_date
 * - Sets submission_channel to PORTAL
 * - Creates notification
 */
export async function submitPilotFlightRequest(
  request: FlightRequestInput
): Promise<ServiceResponse<FlightRequest>> {
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

    // Calculate roster period from start_date
    const startDate = new Date(request.start_date)
    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        error: 'Invalid start date format',
      }
    }

    const rosterPeriodCode = getRosterPeriodCodeFromDate(startDate)
    const parsed = parseRosterPeriodCode(rosterPeriodCode)
    if (!parsed) {
      return {
        success: false,
        error: 'Unable to calculate roster period for the selected start date',
      }
    }

    const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Prepare RDO/SDO request data for unified pilot_requests table
    const flightRequestData = {
      // Core pilot identification
      pilot_id: pilotDetails.id,
      pilot_user_id: pilot.id,

      // Request classification
      request_category: 'FLIGHT' as const,
      request_type: request.request_type,
      submission_channel: 'PILOT_PORTAL' as const,

      // Denormalized pilot data (for reporting performance)
      name: `${pilotDetails.first_name} ${pilotDetails.last_name}`.toUpperCase(),
      rank: pilotDetails.role,
      employee_number: pilotDetails.employee_id,

      // Request details (RDO/SDO requests support date ranges)
      start_date: request.start_date,
      end_date: request.end_date || null, // Optional for multi-day requests
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

    // Insert RDO/SDO request into pilot_requests table
    const { data: createdRequest, error: insertError } = await supabase
      .from('pilot_requests')
      .insert(flightRequestData)
      .select()
      .single()

    if (insertError || !createdRequest) {
      console.error('Insert RDO/SDO request error:', insertError)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.CREATE_FAILED.message,
      }
    }

    // Map back to FlightRequest interface
    const mappedRequest: FlightRequest = {
      id: createdRequest.id,
      pilot_id: createdRequest.pilot_id!,
      pilot_user_id: createdRequest.pilot_user_id!,
      request_type: createdRequest.request_type as FlightRequest['request_type'],
      start_date: createdRequest.start_date!,
      end_date: createdRequest.end_date,
      description: createdRequest.notes,
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
 * Get Current Pilot's RDO/SDO Requests
 *
 * Retrieves all RDO/SDO requests for the authenticated pilot.
 * Sorted by created_at descending (newest first).
 */
export async function getCurrentPilotFlightRequests(): Promise<ServiceResponse<FlightRequest[]>> {
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

    // Query RDO/SDO requests from pilot_requests table with request_category filter
    // Use BOTH pilot_user_id AND pilot_id to catch all requests
    const { data: requests, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('request_category', 'FLIGHT')
      .or(`pilot_user_id.eq.${pilot.id},pilot_id.eq.${pilot.pilot_id || pilot.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get RDO/SDO requests error:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FLIGHT.FETCH_FAILED.message,
      }
    }

    // Map to FlightRequest interface
    const mappedRequests: FlightRequest[] = (requests || []).map((req) => ({
      id: req.id,
      pilot_id: req.pilot_id!,
      pilot_user_id: req.pilot_user_id!,
      request_type: req.request_type as FlightRequest['request_type'],
      start_date: req.start_date!,
      end_date: req.end_date,
      description: req.notes,
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
 * Update Pilot RDO/SDO Request
 *
 * Allows pilot to update their own SUBMITTED RDO/SDO requests.
 * Cannot update requests that are UNDER_REVIEW, APPROVED, or DENIED.
 */
export async function updatePilotFlightRequest(
  requestId: string,
  updates: FlightRequestInput
): Promise<ServiceResponse<FlightRequest>> {
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

    // Verify request belongs to pilot and is SUBMITTED
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('id, pilot_id, workflow_status, request_category')
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
    if (request.pilot_id !== pilot.pilot_id) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.FORBIDDEN.message,
      }
    }

    // Check if submitted (pilots can only edit submitted requests)
    if (request.workflow_status !== 'SUBMITTED') {
      return {
        success: false,
        error:
          'Can only edit submitted requests. This request has already been reviewed or is under review.',
      }
    }

    // Calculate roster period from updated start_date
    const startDate = new Date(updates.start_date)
    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        error: 'Invalid start date format',
      }
    }

    const rosterPeriodCode = getRosterPeriodCodeFromDate(startDate)
    const parsed = parseRosterPeriodCode(rosterPeriodCode)
    if (!parsed) {
      return {
        success: false,
        error: 'Unable to calculate roster period for the selected start date',
      }
    }

    const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Prepare update data
    const updateData = {
      request_type: updates.request_type,
      start_date: updates.start_date,
      end_date: updates.end_date || null,
      notes: updates.description || null,
      reason: updates.reason || null,
      roster_period: rosterPeriodCode,
      roster_period_start_date: rosterPeriod.startDate.toISOString().split('T')[0],
      roster_publish_date: rosterPeriod.publishDate.toISOString().split('T')[0],
      roster_deadline_date: rosterPeriod.deadlineDate.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('pilot_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('request_category', 'FLIGHT')
      .select()
      .single()

    if (updateError || !updatedRequest) {
      console.error('Update RDO/SDO request error:', updateError)
      return {
        success: false,
        error: 'Failed to update RDO/SDO request',
      }
    }

    // Map back to FlightRequest interface
    const mappedRequest: FlightRequest = {
      id: updatedRequest.id,
      pilot_id: updatedRequest.pilot_id!,
      pilot_user_id: updatedRequest.pilot_user_id!,
      request_type: updatedRequest.request_type as FlightRequest['request_type'],
      start_date: updatedRequest.start_date!,
      end_date: updatedRequest.end_date,
      description: updatedRequest.notes,
      reason: updatedRequest.reason,
      workflow_status: updatedRequest.workflow_status as FlightRequest['workflow_status'],
      review_comments: updatedRequest.review_comments,
      reviewed_by: updatedRequest.reviewed_by,
      reviewed_at: updatedRequest.reviewed_at,
      created_at: updatedRequest.created_at!,
      updated_at: updatedRequest.updated_at,
      name: updatedRequest.name,
      rank: updatedRequest.rank,
      employee_number: updatedRequest.employee_number,
      roster_period: updatedRequest.roster_period,
      submission_channel: updatedRequest.submission_channel,
    }

    return {
      success: true,
      data: mappedRequest,
    }
  } catch (error) {
    console.error('Update pilot flight request error:', error)
    return {
      success: false,
      error: 'Failed to update RDO/SDO request',
    }
  }
}

/**
 * Cancel Pilot RDO/SDO Request
 *
 * Allows pilot to cancel their own SUBMITTED RDO/SDO requests.
 * Cannot cancel requests that are UNDER_REVIEW, APPROVED, or DENIED.
 */
export async function cancelPilotFlightRequest(requestId: string): Promise<ServiceResponse> {
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

    // Verify request belongs to pilot and is SUBMITTED
    const { data: request, error: fetchError } = await supabase
      .from('pilot_requests')
      .select(
        'id, pilot_id, workflow_status, request_type, start_date, end_date, notes, request_category'
      )
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
        error:
          'Can only cancel submitted requests. This request has already been reviewed or is under review.',
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
    const supabase = createServiceRoleClient()

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
