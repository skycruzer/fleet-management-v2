/**
 * RDO/SDO Request Service
 *
 * Handles RDO (Rostered Day Off) and SDO (Scheduled Day Off) requests.
 * These are schedule-related requests separate from leave requests.
 *
 * @author Maurice Rondeau
 * @date January 19, 2025
 * @version 3.0.0 - 3-table architecture
 *
 * IMPORTANT:
 * - RDO/SDO requests use dedicated rdo_sdo_requests table
 * - Pilots can cancel APPROVED requests (sets status to WITHDRAWN)
 * - Pilots CANNOT edit APPROVED/DENIED requests
 * - All operations logged in audit trail
 */

import { createClient } from '@/lib/supabase/server'
import {
  getRosterPeriodCodeFromDate,
  getRosterPeriodsForDateRange,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
} from './roster-period-service'
import type { Database } from '@/types/supabase'

// ============================================================================
// Type Definitions
// ============================================================================

export type RdoSdoRequestType = 'RDO' | 'SDO'

export type WorkflowStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'

export type SubmissionChannel = 'PILOT_PORTAL' | 'EMAIL' | 'PHONE' | 'ORACLE' | 'ADMIN_PORTAL'

export interface RdoSdoRequest {
  id: string
  pilot_id: string
  pilot_user_id?: string | null
  employee_number: string
  rank: string
  name: string
  request_type: RdoSdoRequestType
  submission_channel: SubmissionChannel
  submission_date: string
  submitted_by_admin_id?: string | null
  source_reference?: string | null
  source_attachment_url?: string | null
  start_date: string
  end_date?: string | null
  days_count?: number | null
  roster_period: string
  roster_period_start_date: string
  roster_publish_date: string
  roster_deadline_date: string
  workflow_status: WorkflowStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comments?: string | null
  conflict_flags?: string[] | null
  availability_impact?: Record<string, any> | null
  is_late_request: boolean
  is_past_deadline: boolean
  priority_score: number
  reason?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

export interface CreateRdoSdoRequestInput {
  pilot_id: string
  pilot_user_id?: string
  request_type: RdoSdoRequestType
  start_date: string
  end_date?: string
  reason?: string
  notes?: string
  submission_channel?: SubmissionChannel
  submitted_by_admin_id?: string
}

export interface UpdateRdoSdoRequestInput {
  request_type?: RdoSdoRequestType
  start_date?: string
  end_date?: string
  reason?: string
  notes?: string
}

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Create RDO/SDO Request
// ============================================================================

/**
 * Create a new RDO/SDO request
 *
 * Features:
 * - Auto-calculates roster period from dates
 * - Fetches and denormalizes pilot data
 * - Validates no duplicate requests
 * - Calculates late/past deadline flags
 *
 * @param input - Request creation data
 * @returns Service response with created request
 */
export async function createRdoSdoRequest(
  input: CreateRdoSdoRequestInput
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    const supabase = await createClient()

    // Fetch pilot details for denormalized fields
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('id, employee_id, first_name, last_name, role')
      .eq('id', input.pilot_id)
      .single()

    if (pilotError || !pilot) {
      return {
        success: false,
        error: 'Pilot not found',
      }
    }

    // Calculate roster period from start date
    const startDate = new Date(input.start_date)
    const rosterPeriodCode = getRosterPeriodCodeFromDate(startDate)
    const parsed = parseRosterPeriodCode(rosterPeriodCode)

    if (!parsed) {
      return {
        success: false,
        error: 'Invalid roster period calculation',
      }
    }

    const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Calculate days count
    const endDate = input.end_date ? new Date(input.end_date) : startDate
    const daysCount = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    // Check if request is late or past deadline
    const now = new Date()
    const isLateRequest = rosterPeriod.daysUntilDeadline < 21 && rosterPeriod.daysUntilDeadline >= 0
    const isPastDeadline = rosterPeriod.isPastDeadline

    // Prepare request data
    const requestData = {
      pilot_id: pilot.id,
      pilot_user_id: input.pilot_user_id || null,
      employee_number: pilot.employee_id,
      rank: pilot.role,
      name: `${pilot.first_name} ${pilot.last_name}`.toUpperCase(),
      request_type: input.request_type,
      submission_channel: input.submission_channel || 'PILOT_PORTAL',
      submission_date: now.toISOString(),
      submitted_by_admin_id: input.submitted_by_admin_id || null,
      start_date: input.start_date,
      end_date: input.end_date || null,
      days_count: daysCount,
      roster_period: rosterPeriodCode,
      roster_period_start_date: rosterPeriod.startDate.toISOString().split('T')[0],
      roster_publish_date: rosterPeriod.publishDate.toISOString().split('T')[0],
      roster_deadline_date: rosterPeriod.deadlineDate.toISOString().split('T')[0],
      workflow_status: 'SUBMITTED' as const,
      is_late_request: isLateRequest,
      is_past_deadline: isPastDeadline,
      priority_score: 0,
      reason: input.reason || null,
      notes: input.notes || null,
    }

    // Insert into database
    const { data: createdRequest, error: insertError } = await supabase
      .from('rdo_sdo_requests')
      .insert(requestData)
      .select()
      .single()

    if (insertError) {
      console.error('Create RDO/SDO request error:', insertError)

      // Handle duplicate request error
      if (insertError.code === '23505') {
        return {
          success: false,
          error: 'A similar RDO/SDO request already exists for these dates',
        }
      }

      return {
        success: false,
        error: insertError.message,
      }
    }

    return {
      success: true,
      data: createdRequest as RdoSdoRequest,
    }
  } catch (error) {
    console.error('Create RDO/SDO request exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Get RDO/SDO Requests
// ============================================================================

/**
 * Get all RDO/SDO requests for a pilot
 *
 * @param pilotId - Pilot UUID
 * @returns Service response with array of requests
 */
export async function getRdoSdoRequests(
  pilotId: string
): Promise<ServiceResponse<RdoSdoRequest[]>> {
  try {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('rdo_sdo_requests')
      .select('*')
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get RDO/SDO requests error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: (requests || []) as RdoSdoRequest[],
    }
  } catch (error) {
    console.error('Get RDO/SDO requests exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all RDO/SDO requests (admin view)
 *
 * @param filters - Optional filters
 * @returns Service response with array of requests
 */
export async function getAllRdoSdoRequests(filters?: {
  workflow_status?: WorkflowStatus | WorkflowStatus[]
  request_type?: RdoSdoRequestType
  roster_period?: string
  start_date_from?: string
  start_date_to?: string
}): Promise<ServiceResponse<RdoSdoRequest[]>> {
  try {
    const supabase = await createClient()

    let query = supabase.from('rdo_sdo_requests').select('*')

    // Apply filters
    if (filters?.workflow_status) {
      if (Array.isArray(filters.workflow_status)) {
        query = query.in('workflow_status', filters.workflow_status)
      } else {
        query = query.eq('workflow_status', filters.workflow_status)
      }
    }

    if (filters?.request_type) {
      query = query.eq('request_type', filters.request_type)
    }

    if (filters?.roster_period) {
      query = query.eq('roster_period', filters.roster_period)
    }

    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }

    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }

    query = query.order('created_at', { ascending: false })

    const { data: requests, error } = await query

    if (error) {
      console.error('Get all RDO/SDO requests error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: (requests || []) as RdoSdoRequest[],
    }
  } catch (error) {
    console.error('Get all RDO/SDO requests exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get single RDO/SDO request by ID
 */
export async function getRdoSdoRequestById(
  requestId: string
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    const supabase = await createClient()

    const { data: request, error } = await supabase
      .from('rdo_sdo_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) {
      console.error('Get RDO/SDO request error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: request as RdoSdoRequest,
    }
  } catch (error) {
    console.error('Get RDO/SDO request exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Update RDO/SDO Request
// ============================================================================

/**
 * Update RDO/SDO request (pilots can only update SUBMITTED requests)
 *
 * IMPORTANT: Pilots cannot edit APPROVED or DENIED requests
 */
export async function updateRdoSdoRequest(
  requestId: string,
  updates: UpdateRdoSdoRequestInput
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    const supabase = await createClient()

    // Fetch current request to check status
    const { data: currentRequest, error: fetchError } = await supabase
      .from('rdo_sdo_requests')
      .select('workflow_status')
      .eq('id', requestId)
      .single()

    if (fetchError || !currentRequest) {
      return {
        success: false,
        error: 'Request not found',
      }
    }

    // Prevent edits to approved/denied requests
    if (currentRequest.workflow_status !== 'SUBMITTED') {
      return {
        success: false,
        error: 'Cannot edit approved or denied requests. Cancel and resubmit instead.',
      }
    }

    // Update request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('rdo_sdo_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('Update RDO/SDO request error:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    return {
      success: true,
      data: updatedRequest as RdoSdoRequest,
    }
  } catch (error) {
    console.error('Update RDO/SDO request exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Cancel RDO/SDO Request
// ============================================================================

/**
 * Cancel RDO/SDO request (sets status to WITHDRAWN)
 *
 * IMPORTANT: Pilots can cancel SUBMITTED, IN_REVIEW, or APPROVED requests
 */
export async function cancelRdoSdoRequest(
  requestId: string
): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()

    // Update status to WITHDRAWN
    const { error: updateError } = await supabase
      .from('rdo_sdo_requests')
      .update({ workflow_status: 'WITHDRAWN' })
      .eq('id', requestId)
      .in('workflow_status', ['SUBMITTED', 'IN_REVIEW', 'APPROVED'])

    if (updateError) {
      console.error('Cancel RDO/SDO request error:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Cancel RDO/SDO request exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Approve/Deny RDO/SDO Request (Admin Only)
// ============================================================================

/**
 * Update workflow status (admin operation)
 */
export async function updateRdoSdoRequestStatus(
  requestId: string,
  status: 'APPROVED' | 'DENIED',
  reviewedBy: string,
  reviewComments?: string
): Promise<ServiceResponse<RdoSdoRequest>> {
  try {
    const supabase = await createClient()

    const { data: updatedRequest, error } = await supabase
      .from('rdo_sdo_requests')
      .update({
        workflow_status: status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_comments: reviewComments || null,
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Update RDO/SDO request status error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: updatedRequest as RdoSdoRequest,
    }
  } catch (error) {
    console.error('Update RDO/SDO request status exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get RDO/SDO request statistics
 */
export async function getRdoSdoStats(pilotId?: string): Promise<
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
    const supabase = await createClient()

    let query = supabase
      .from('rdo_sdo_requests')
      .select('workflow_status')

    if (pilotId) {
      query = query.eq('pilot_id', pilotId)
    }

    const { data: requests, error } = await query

    if (error) {
      return {
        success: false,
        error: error.message,
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
    console.error('Get RDO/SDO stats exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
