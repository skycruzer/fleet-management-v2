/**
 * Unified Request Service
 *
 * Handles all pilot requests (leave, flight, bids) in a single unified service layer.
 * Provides comprehensive CRUD operations, filtering, validation, and business logic.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @spec UNIFIED-REQUEST-SYSTEM-IMPLEMENTATION.md
 *
 * NOTE: This service requires the pilot_requests table migration to be deployed.
 * After deploying migration 20251111124223_create_pilot_requests_table.sql,
 * run `npm run db:types` to generate the TypeScript types.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  getRosterPeriodCodeFromDate,
  calculateRosterPeriodDates,
  parseRosterPeriodCode,
  ensureRosterPeriodsExist,
} from '@/lib/services/roster-period-service'
import { detectConflicts, type RequestInput } from '@/lib/services/conflict-detection-service'
import { checkCrewAvailabilityAtomic } from '@/lib/services/leave-eligibility-service'
import { invalidateCacheByTag } from '@/lib/services/unified-cache-service'
import { notifyAllAdmins, createNotification } from '@/lib/services/notification-service'
import type { NotificationType } from '@/lib/services/notification-service'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { logger } from '@/lib/services/logging-service'
import { sendRequestLifecycleEmail } from '@/lib/services/pilot-email-service'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Request categories
 */
export type RequestCategory = 'LEAVE' | 'FLIGHT' | 'LEAVE_BID'

/**
 * Request types by category
 *
 * IMPORTANT: RDO and SDO are classified as FLIGHT requests (roster/schedule related)
 * NOT as leave requests. They represent rostered days off that are part of flight scheduling.
 */
export type LeaveRequestType = 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
export type FlightRequestType =
  | 'RDO' // Rostered Day Off (flight schedule related)
  | 'SDO' // Substitute Day Off (flight schedule related)
  | 'FLIGHT_REQUEST'
  | 'SCHEDULE_CHANGE'
export type RequestType = LeaveRequestType | FlightRequestType

/**
 * Submission channels
 */
export type SubmissionChannel = 'PILOT_PORTAL' | 'EMAIL' | 'PHONE' | 'ORACLE' | 'ADMIN_PORTAL'

/**
 * Workflow status
 */
export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'WITHDRAWN'

/**
 * Pilot rank
 */
export type PilotRank = 'Captain' | 'First Officer'

/**
 * Complete pilot request with joined data
 */
export interface PilotRequest {
  // Identity
  id: string
  pilot_id: string
  pilot_user_id: string | null
  employee_number: string
  rank: PilotRank
  name: string

  // Request Classification
  request_category: RequestCategory
  request_type: RequestType

  // Submission Tracking
  submission_channel: SubmissionChannel
  submission_date: string
  submitted_by_admin_id: string | null
  source_reference: string | null
  source_attachment_url: string | null

  // Date/Time Details
  start_date: string
  end_date: string | null
  days_count: number | null
  flight_date: string | null
  roster_period: string
  roster_period_start_date: string
  roster_publish_date: string
  roster_deadline_date: string

  // Workflow Status
  workflow_status: WorkflowStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_comments: string | null

  // Conflict Detection
  conflict_flags: string[]
  availability_impact: {
    captains_before?: number
    captains_after?: number
    fos_before?: number
    fos_after?: number
  } | null

  // Metadata
  is_late_request: boolean
  is_past_deadline: boolean
  priority_score: number
  reason: string | null
  notes: string | null
  approval_checklist: Record<string, boolean> | null

  // Audit
  created_at: string
  updated_at: string

  // Joined data (optional)
  pilot?: {
    first_name: string
    last_name: string
    seniority_number: number
    role?: 'Captain' | 'First Officer'
    employee_id?: string
  }
  reviewer?: {
    name: string
  }
  submitted_by?: {
    name: string
  }
}

/**
 * Input for creating a new pilot request
 */
export interface CreatePilotRequestInput {
  pilot_id: string
  employee_number: string
  rank: PilotRank
  name: string
  request_category: RequestCategory
  request_type: RequestType
  submission_channel: SubmissionChannel
  start_date: string // ISO date format
  end_date?: string // ISO date format (optional for single-day requests)
  flight_date?: string // ISO date format (for flight requests)
  reason?: string
  notes?: string
  submitted_by_admin_id?: string
  source_reference?: string
  source_attachment_url?: string
}

/**
 * Input for updating a pilot request
 */
export interface UpdatePilotRequestInput {
  request_type?: RequestType
  start_date?: string
  end_date?: string
  flight_date?: string
  reason?: string
  notes?: string
  source_reference?: string
  source_attachment_url?: string
}

/**
 * Filters for querying pilot requests
 */
export interface PilotRequestFilters {
  roster_period?: string | string[]
  pilot_id?: string
  status?: WorkflowStatus[]
  request_category?: RequestCategory[]
  submission_channel?: SubmissionChannel[]
  start_date_from?: string
  start_date_to?: string
  is_late_request?: boolean
  is_past_deadline?: boolean
  limit?: number
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
  conflicts?: import('@/lib/services/conflict-detection-service').Conflict[]
  warnings?: string[]
  canApprove?: boolean
  crewImpact?: {
    captainsBefore?: number
    captainsAfter?: number
    firstOfficersBefore?: number
    firstOfficersAfter?: number
    belowMinimum?: boolean
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new pilot request
 *
 * Automatically calculates:
 * - Roster period from start_date
 * - Roster period dates (start, publish, deadline)
 * - Days count (for multi-day requests)
 * - is_late_request flag (< 21 days before roster period start)
 * - is_past_deadline flag (after roster deadline date)
 * - priority_score (based on seniority - requires pilot lookup)
 *
 * @param input - Request creation data
 * @returns Created request with auto-calculated fields
 */
export async function createPilotRequest(
  input: CreatePilotRequestInput
): Promise<ServiceResponse<PilotRequest>> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  try {
    // Ensure roster periods exist (auto-create if missing)
    await ensureRosterPeriodsExist()

    // Validate required fields
    if (!input.pilot_id || !input.start_date) {
      return {
        success: false,
        error: 'Pilot ID and start date are required',
      }
    }

    // Parse start date
    const startDate = new Date(input.start_date)
    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        error: 'Invalid start date format',
      }
    }

    // Calculate roster period from start date
    const rosterPeriodCode = getRosterPeriodCodeFromDate(startDate)
    const parsed = parseRosterPeriodCode(rosterPeriodCode)
    if (!parsed) {
      return {
        success: false,
        error: `Unable to calculate roster period from code: ${rosterPeriodCode}`,
      }
    }

    // Get full roster period details
    const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)

    // Calculate days count (for multi-day requests)
    let daysCount: number | null = null
    if (input.end_date) {
      const endDate = new Date(input.end_date)
      if (isNaN(endDate.getTime())) {
        return {
          success: false,
          error: 'Invalid end date format',
        }
      }

      if (endDate < startDate) {
        return {
          success: false,
          error: 'End date must be on or after start date',
        }
      }

      const diffTime = endDate.getTime() - startDate.getTime()
      daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Inclusive
    } else {
      daysCount = 1 // Single-day request
    }

    // Calculate is_late_request (submission_date < 21 days before roster period start)
    // At creation time, submission_date = now
    const submissionDate = new Date()
    const daysUntilRosterStart = Math.ceil(
      (rosterPeriod.startDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const isLateRequest = daysUntilRosterStart < 21

    // Calculate is_past_deadline (after roster deadline date)
    const isPastDeadline = submissionDate > rosterPeriod.deadlineDate

    // Get pilot seniority for priority score
    const { data: pilot, error: pilotError } = await supabase
      .from('pilots')
      .select('seniority_number')
      .eq('id', input.pilot_id)
      .single()

    if (pilotError) {
      await logger.error('Failed to fetch pilot seniority', {
        source: 'unified-request-service:createPilotRequest',
        pilot_id: input.pilot_id,
        error: pilotError,
      })
    }

    const priorityScore = pilot?.seniority_number || 999

    // Run conflict detection BEFORE creating the request
    const conflictInput: RequestInput = {
      pilotId: input.pilot_id,
      rank: input.rank,
      startDate: input.start_date,
      endDate: input.end_date || null,
      requestCategory: input.request_category,
    }

    const conflictResult = await detectConflicts(conflictInput)

    // If critical conflicts exist, prevent creation
    const criticalConflicts = conflictResult.conflicts.filter((c) => c.severity === 'CRITICAL')

    if (criticalConflicts.length > 0) {
      await logger.warn('Request blocked due to critical conflicts', {
        source: 'unified-request-service:createPilotRequest',
        pilot_id: input.pilot_id,
        conflicts: criticalConflicts,
      })

      return {
        success: false,
        error: criticalConflicts[0].message,
        conflicts: conflictResult.conflicts,
        warnings: conflictResult.warnings,
        canApprove: false,
      }
    }

    // Prepare conflict flags for database
    const conflictFlags = conflictResult.conflicts.map((c) => c.type)
    const availabilityImpact = conflictResult.crewImpact
      ? {
          captains_before: conflictResult.crewImpact.captainsBefore,
          captains_after: conflictResult.crewImpact.captainsAfter,
          fos_before: conflictResult.crewImpact.firstOfficersBefore,
          fos_after: conflictResult.crewImpact.firstOfficersAfter,
        }
      : null

    // Insert the request with conflict data
    const { data, error } = await supabase
      .from('pilot_requests')
      .insert({
        pilot_id: input.pilot_id,
        employee_number: input.employee_number,
        rank: input.rank,
        name: input.name,
        request_category: input.request_category,
        request_type: input.request_type,
        submission_channel: input.submission_channel,
        start_date: input.start_date,
        end_date: input.end_date || null,
        days_count: daysCount,
        flight_date: input.flight_date || null,
        roster_period: rosterPeriodCode,
        roster_period_start_date: rosterPeriod.startDate.toISOString().split('T')[0],
        roster_publish_date: rosterPeriod.publishDate.toISOString().split('T')[0],
        roster_deadline_date: rosterPeriod.deadlineDate.toISOString().split('T')[0],
        workflow_status: 'SUBMITTED',
        is_late_request: isLateRequest,
        is_past_deadline: isPastDeadline,
        priority_score: priorityScore,
        reason: input.reason || null,
        notes: input.notes || null,
        submitted_by_admin_id: input.submitted_by_admin_id || null,
        source_reference: input.source_reference || null,
        source_attachment_url: input.source_attachment_url || null,
        conflict_flags: conflictFlags,
        availability_impact: availabilityImpact,
      })
      .select()
      .single()

    if (error) {
      await logger.error('Failed to create pilot request', {
        source: 'unified-request-service:createPilotRequest',
        error: error.message,
        input,
      })
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.CREATE_FAILED('pilot request').message,
      }
    }

    // Invalidate report caches to ensure fresh data
    if (input.request_category === 'LEAVE') {
      await invalidateCacheByTag('reports:leave')
    } else if (input.request_category === 'FLIGHT') {
      await invalidateCacheByTag('reports:rdo-sdo')
    }
    await invalidateCacheByTag('reports:all-requests')

    // Log conflict detection results
    if (conflictResult.conflicts.length > 0) {
      await logger.info('Request created with conflicts', {
        source: 'unified-request-service:createPilotRequest',
        request_id: data.id,
        conflicts: conflictResult.conflicts.length,
        canApprove: conflictResult.canApprove,
      })
    }

    // Notify admins about new requests (for pilot portal submissions)
    if (input.submission_channel === 'PILOT_PORTAL') {
      const requestTypeLabel =
        input.request_category === 'LEAVE' ? 'Leave Request' : 'Flight Request'
      const notificationType =
        input.request_category === 'LEAVE' ? 'leave_request_submitted' : 'flight_request_submitted'
      notifyAllAdmins(
        `New ${requestTypeLabel}`,
        `${input.name} submitted a ${input.request_type} request for ${input.start_date}`,
        notificationType,
        '/dashboard/requests'
      ).catch((err) => console.error('Failed to notify admins:', err))
    }

    // Send email confirmation to pilot (fire-and-forget)
    sendRequestLifecycleEmail(input.pilot_id, 'submitted', {
      requestCategory: input.request_category as 'LEAVE' | 'FLIGHT',
      requestType: input.request_type,
      startDate: input.start_date,
      endDate: input.end_date || null,
      daysCount: daysCount,
      flightDate: input.flight_date || null,
      reason: input.reason || null,
    }).catch((err: unknown) => console.error('Failed to send submission email:', err))

    return {
      success: true,
      data: data as unknown as PilotRequest,
      conflicts: conflictResult.conflicts,
      warnings: conflictResult.warnings,
      canApprove: conflictResult.canApprove,
      crewImpact: conflictResult.crewImpact,
    }
  } catch (error) {
    await logger.error('Failed to create pilot request', {
      source: 'unified-request-service:createPilotRequest',
      error: error instanceof Error ? error.message : String(error),
      input,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.CREATE_FAILED('pilot request').message,
    }
  }
}

/**
 * Get all pilot requests with optional filters
 *
 * @param filters - Optional filters to apply
 * @returns Array of pilot requests with joined data
 */
export async function getAllPilotRequests(
  filters?: PilotRequestFilters
): Promise<ServiceResponse<PilotRequest[]>> {
  const supabase = createAdminClient()

  try {
    let query = supabase.from('pilot_requests').select(
      `
        *,
        pilot:pilots!pilot_id (
          first_name,
          last_name,
          seniority_number,
          role,
          employee_id
        )
      `
    )

    // Apply filters
    if (filters) {
      if (filters.roster_period) {
        const periods = Array.isArray(filters.roster_period)
          ? filters.roster_period
          : [filters.roster_period]
        query = query.in('roster_period', periods)
      }
      if (filters.pilot_id) {
        query = query.eq('pilot_id', filters.pilot_id)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('workflow_status', filters.status)
      }
      if (filters.request_category && filters.request_category.length > 0) {
        query = query.in('request_category', filters.request_category)
      }
      if (filters.submission_channel && filters.submission_channel.length > 0) {
        query = query.in('submission_channel', filters.submission_channel)
      }
      if (filters.start_date_from) {
        query = query.gte('start_date', filters.start_date_from)
      }
      if (filters.start_date_to) {
        query = query.lte('start_date', filters.start_date_to)
      }
      if (filters.is_late_request !== undefined) {
        query = query.eq('is_late_request', filters.is_late_request)
      }
      if (filters.is_past_deadline !== undefined) {
        query = query.eq('is_past_deadline', filters.is_past_deadline)
      }
    }

    // Order by submission date (most recent first)
    query = query.order('submission_date', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      await logger.error('Failed to fetch pilot requests', {
        source: 'unified-request-service:getAllPilotRequests',
        error: error.message,
        filters,
      })
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('pilot requests').message,
      }
    }

    // Compute roster periods spanned for each request
    const { getRosterPeriodsForDateRange } = await import('@/lib/services/roster-period-service')
    const requestsWithPeriods = (data || []).map((req: any) => ({
      ...req,
      roster_periods_spanned: getRosterPeriodsForDateRange(
        req.start_date,
        req.end_date || req.start_date // Use start_date as end_date for single-day requests
      ),
    }))

    return {
      success: true,
      data: requestsWithPeriods as unknown as PilotRequest[],
    }
  } catch (error) {
    await logger.error('Failed to fetch pilot requests', {
      source: 'unified-request-service:getAllPilotRequests',
      error: error instanceof Error ? error.message : String(error),
      filters,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('pilot requests').message,
    }
  }
}

/**
 * Get a single pilot request by ID
 *
 * @param id - Request ID
 * @returns Pilot request with joined pilot and reviewer data
 */
export async function getPilotRequestById(id: string): Promise<ServiceResponse<PilotRequest>> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .from('pilot_requests')
      .select(
        `
        *,
        pilot:pilots!pilot_id (
          first_name,
          last_name,
          seniority_number
        ),
        reviewer:an_users!reviewed_by (
          name
        ),
        submitted_by:an_users!submitted_by_admin_id (
          name
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      await logger.error('Failed to fetch pilot request', {
        source: 'unified-request-service:getPilotRequestById',
        error: error.message,
        id,
      })
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.NOT_FOUND('Pilot request').message,
      }
    }

    // Compute roster periods spanned (same enrichment as getAllPilotRequests)
    const { getRosterPeriodsForDateRange } = await import('@/lib/services/roster-period-service')
    const enrichedData = {
      ...data,
      roster_periods_spanned: getRosterPeriodsForDateRange(
        data.start_date,
        data.end_date || data.start_date
      ),
    }

    return {
      success: true,
      data: enrichedData as unknown as PilotRequest,
    }
  } catch (error) {
    await logger.error('Failed to fetch pilot request', {
      source: 'unified-request-service:getPilotRequestById',
      error: error instanceof Error ? error.message : String(error),
      id,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('pilot request').message,
    }
  }
}

/**
 * Update request workflow status
 *
 * @param id - Request ID
 * @param status - New workflow status
 * @param reviewedBy - User ID of reviewer
 * @param comments - Review comments (required for DENIED status)
 * @returns Updated request
 */
export async function updateRequestStatus(
  id: string,
  status: WorkflowStatus,
  reviewedBy: string,
  comments?: string,
  force?: boolean
): Promise<ServiceResponse<PilotRequest>> {
  // Use admin client to bypass RLS (auth verified at API layer)
  const supabase = createAdminClient()

  try {
    // Validate required comments for denial
    if (status === 'DENIED' && !comments) {
      return {
        success: false,
        error: 'Comments are required when denying a request',
      }
    }

    // For LEAVE request approvals, check crew availability atomically
    // This prevents race conditions where concurrent approvals could violate minimum crew requirements
    if (status === 'APPROVED') {
      // First, get the request details to check if it's a leave request
      const { data: request, error: fetchError } = await supabase
        .from('pilot_requests')
        .select('id, request_category, start_date, end_date')
        .eq('id', id)
        .single()

      if (fetchError || !request) {
        return {
          success: false,
          error: 'Request not found',
        }
      }

      // Check crew availability for LEAVE requests
      if (request.request_category === 'LEAVE' && request.start_date && request.end_date) {
        try {
          const crewCheck = await checkCrewAvailabilityAtomic(
            request.start_date,
            request.end_date,
            id // Exclude this request from the count
          )

          if (!crewCheck.canApprove) {
            if (force) {
              await logger.warn('Leave approval FORCE-APPROVED despite insufficient crew', {
                source: 'unified-request-service:updateRequestStatus',
                requestId: id,
                reason: crewCheck.reason,
                captainsAvailable: crewCheck.captains.available,
                firstOfficersAvailable: crewCheck.firstOfficers.available,
                reviewedBy,
              })
            } else {
              await logger.warn('Leave approval blocked - insufficient crew', {
                source: 'unified-request-service:updateRequestStatus',
                requestId: id,
                reason: crewCheck.reason,
                captainsAvailable: crewCheck.captains.available,
                firstOfficersAvailable: crewCheck.firstOfficers.available,
              })

              return {
                success: false,
                error: `Cannot approve: ${crewCheck.reason}`,
              }
            }
          }
        } catch (crewCheckError) {
          const errorMessage =
            crewCheckError instanceof Error ? crewCheckError.message : String(crewCheckError)

          await logger.error('Crew availability check failed', {
            source: 'unified-request-service:updateRequestStatus',
            requestId: id,
            error: errorMessage,
            startDate: request.start_date,
            endDate: request.end_date,
          })

          // Expose actual error message for better debugging
          return {
            success: false,
            error: `Unable to verify crew availability: ${errorMessage}`,
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('pilot_requests')
      .update({
        workflow_status: status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await logger.error('Failed to update request status', {
        source: 'unified-request-service:updateRequestStatus',
        error: error.message,
        id,
        status,
      })
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.UPDATE_FAILED('request status').message,
      }
    }

    // Create in-app notification for the pilot (fire-and-forget)
    if (data.pilot_user_id) {
      const isLeave = data.request_category === 'LEAVE'
      const notificationConfig: Record<
        string,
        { title: string; message: string; type: NotificationType }
      > = {
        APPROVED: {
          title: 'Request Approved',
          message: `Your ${data.request_type} request has been approved.${comments ? ` Comments: ${comments}` : ''}`,
          type: isLeave ? 'leave_request_approved' : 'flight_request_approved',
        },
        DENIED: {
          title: 'Request Denied',
          message: `Your ${data.request_type} request has been denied.${comments ? ` Reason: ${comments}` : ''}`,
          type: isLeave ? 'leave_request_rejected' : 'flight_request_rejected',
        },
        ...(isLeave && {
          IN_REVIEW: {
            title: 'Request Under Review',
            message: `Your ${data.request_type} request is now being reviewed.`,
            type: 'leave_request_pending_review' as NotificationType,
          },
        }),
      }

      const config = notificationConfig[status]
      if (config) {
        createNotification({
          userId: data.pilot_user_id,
          title: config.title,
          message: config.message,
          type: config.type,
          link: '/portal/requests',
        }).catch((err: unknown) => console.error('Failed to create portal notification:', err))
      }
    }

    // Send email notification for status change (fire-and-forget)
    if (data.pilot_id) {
      const eventMap: Record<string, 'approved' | 'denied' | 'withdrawn'> = {
        APPROVED: 'approved',
        DENIED: 'denied',
        WITHDRAWN: 'withdrawn',
      }
      const emailEvent = eventMap[status]
      if (emailEvent) {
        sendRequestLifecycleEmail(data.pilot_id, emailEvent, {
          requestCategory: data.request_category as 'LEAVE' | 'FLIGHT',
          requestType: data.request_type,
          startDate: data.start_date,
          endDate: data.end_date || null,
          daysCount: data.days_count || null,
          flightDate: data.flight_date || null,
          reason: data.reason || null,
          denialReason: comments || null,
          reviewerComments: comments || null,
        }).catch((err: unknown) => console.error('Failed to send status email:', err))
      }
    }

    return {
      success: true,
      data: data as unknown as PilotRequest,
    }
  } catch (error) {
    await logger.error('Failed to update request status', {
      source: 'unified-request-service:updateRequestStatus',
      error: error instanceof Error ? error.message : String(error),
      id,
      status,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.UPDATE_FAILED('request status').message,
    }
  }
}

/**
 * Update a pilot request's editable fields
 *
 * @param id - Request ID
 * @param updates - Fields to update
 * @returns Updated request
 */
export async function updatePilotRequest(
  id: string,
  updates: UpdatePilotRequestInput
): Promise<ServiceResponse<PilotRequest>> {
  // Use admin client to bypass RLS for admin operations
  const supabase = createAdminClient()

  try {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.request_type !== undefined) {
      updateData.request_type = updates.request_type
    }
    if (updates.start_date !== undefined) {
      updateData.start_date = updates.start_date

      // Recalculate roster period when start date changes
      const startDate = new Date(updates.start_date)
      if (!isNaN(startDate.getTime())) {
        const rosterPeriodCode = getRosterPeriodCodeFromDate(startDate)
        const parsed = parseRosterPeriodCode(rosterPeriodCode)
        if (parsed) {
          const rosterPeriod = calculateRosterPeriodDates(parsed.periodNumber, parsed.year)
          updateData.roster_period = rosterPeriodCode
          updateData.roster_period_start_date = rosterPeriod.startDate.toISOString().split('T')[0]
          updateData.roster_publish_date = rosterPeriod.publishDate.toISOString().split('T')[0]
          updateData.roster_deadline_date = rosterPeriod.deadlineDate.toISOString().split('T')[0]

          // Recalculate is_late_request using ORIGINAL submission_date (not today)
          // Business rule: late = submission_date < 21 days before roster period start
          const { data: existingRequest } = await supabase
            .from('pilot_requests')
            .select('submission_date')
            .eq('id', id)
            .single()

          const originalSubmissionDate = existingRequest?.submission_date
            ? new Date(existingRequest.submission_date)
            : new Date() // fallback for safety

          const daysUntilRosterStart = Math.ceil(
            (rosterPeriod.startDate.getTime() - originalSubmissionDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          updateData.is_late_request = daysUntilRosterStart < 21
          updateData.is_past_deadline = originalSubmissionDate > rosterPeriod.deadlineDate
        }
      }
    }
    if (updates.end_date !== undefined) {
      updateData.end_date = updates.end_date

      // Recalculate days_count when end_date changes
      const startDateStr = updates.start_date || (await getPilotRequestById(id)).data?.start_date
      if (startDateStr && updates.end_date) {
        const startDate = new Date(startDateStr)
        const endDate = new Date(updates.end_date)
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          const diffTime = endDate.getTime() - startDate.getTime()
          updateData.days_count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        }
      }
    }
    if (updates.flight_date !== undefined) {
      updateData.flight_date = updates.flight_date
    }
    if (updates.reason !== undefined) {
      updateData.reason = updates.reason
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }
    if (updates.source_reference !== undefined) {
      updateData.source_reference = updates.source_reference
    }
    if (updates.source_attachment_url !== undefined) {
      updateData.source_attachment_url = updates.source_attachment_url
    }

    const { data, error } = await supabase
      .from('pilot_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      await logger.error('Failed to update pilot request', {
        source: 'unified-request-service:updatePilotRequest',
        error: error.message,
        id,
        updates,
      })
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.UPDATE_FAILED('pilot request').message,
      }
    }

    // Invalidate related caches
    await invalidateCacheByTag('reports:leave')
    await invalidateCacheByTag('reports:rdo-sdo')
    await invalidateCacheByTag('reports:all-requests')

    // Send email notification about the edit (fire-and-forget)
    if (data.pilot_id) {
      sendRequestLifecycleEmail(data.pilot_id, 'edited', {
        requestCategory: data.request_category as 'LEAVE' | 'FLIGHT',
        requestType: data.request_type,
        startDate: data.start_date,
        endDate: data.end_date || null,
        daysCount: data.days_count || null,
        flightDate: data.flight_date || null,
        reason: data.reason || null,
      }).catch((err: unknown) => console.error('Failed to send edit email:', err))
    }

    return {
      success: true,
      data: data as unknown as PilotRequest,
    }
  } catch (error) {
    await logger.error('Failed to update pilot request', {
      source: 'unified-request-service:updatePilotRequest',
      error: error instanceof Error ? error.message : String(error),
      id,
      updates,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.UPDATE_FAILED('pilot request').message,
    }
  }
}

/**
 * Delete a pilot request by ID
 *
 * @param id - Request ID to delete
 * @returns Success/failure result
 */
export async function deletePilotRequest(id: string): Promise<ServiceResponse<void>> {
  // Use admin client to bypass RLS for admin delete operations
  const supabase = createAdminClient()

  try {
    const { error } = await supabase.from('pilot_requests').delete().eq('id', id)

    if (error) {
      await logger.error('Failed to delete pilot request', {
        source: 'unified-request-service:deletePilotRequest',
        error: error.message,
        code: error.code,
        details: error.details,
        id,
      })
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.DATABASE.DELETE_FAILED('pilot request').message,
      }
    }

    // Invalidate related caches
    await invalidateCacheByTag('reports:leave')
    await invalidateCacheByTag('reports:rdo-sdo')
    await invalidateCacheByTag('reports:all-requests')

    return {
      success: true,
    }
  } catch (error) {
    await logger.error('Failed to delete pilot request', {
      source: 'unified-request-service:deletePilotRequest',
      error: error instanceof Error ? error.message : String(error),
      id,
    })
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.DELETE_FAILED('pilot request').message,
    }
  }
}

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Get all requests for a specific roster period
 */
export async function getRequestsByRosterPeriod(
  rosterPeriodCode: string
): Promise<ServiceResponse<PilotRequest[]>> {
  return getAllPilotRequests({ roster_period: rosterPeriodCode })
}

/**
 * Get all requests for a specific pilot
 */
export async function getRequestsByPilot(
  pilotId: string
): Promise<ServiceResponse<PilotRequest[]>> {
  return getAllPilotRequests({ pilot_id: pilotId })
}

/**
 * Get all requests with a specific workflow status
 */
export async function getRequestsByStatus(
  status: WorkflowStatus | WorkflowStatus[]
): Promise<ServiceResponse<PilotRequest[]>> {
  const statuses = Array.isArray(status) ? status : [status]
  return getAllPilotRequests({ status: statuses })
}

/**
 * Get all pending requests (SUBMITTED + IN_REVIEW)
 */
export async function getPendingRequests(): Promise<ServiceResponse<PilotRequest[]>> {
  return getRequestsByStatus(['SUBMITTED', 'IN_REVIEW'])
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate request category and type combination
 */
export function validateRequestType(
  category: RequestCategory,
  type: RequestType
): { valid: boolean; error?: string } {
  const validCombinations: Record<RequestCategory, string[]> = {
    LEAVE: ['ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'],
    FLIGHT: ['RDO', 'SDO', 'FLIGHT_REQUEST', 'SCHEDULE_CHANGE'],
    LEAVE_BID: ['ANNUAL'],
  }

  const validTypes = validCombinations[category]
  if (!validTypes || !validTypes.includes(type)) {
    return {
      valid: false,
      error: `Request type '${type}' is not valid for category '${category}'`,
    }
  }

  return { valid: true }
}

/**
 * Validate submission channel
 */
export function validateSubmissionChannel(channel: string): {
  valid: boolean
  error?: string
} {
  const validChannels: SubmissionChannel[] = [
    'PILOT_PORTAL',
    'EMAIL',
    'PHONE',
    'ORACLE',
    'ADMIN_PORTAL',
  ]

  if (!validChannels.includes(channel as SubmissionChannel)) {
    return {
      valid: false,
      error: `Invalid submission channel: ${channel}`,
    }
  }

  return { valid: true }
}

// ============================================================================
// Backward Compatibility Layer (formerly leave-service.ts)
// ============================================================================
// These types and functions provide backward compatibility for code migrating
// from the deprecated leave-service.ts to the unified request service.

/**
 * LeaveRequest type alias - represents a PilotRequest with request_category='LEAVE'
 */
export type LeaveRequest = PilotRequest

/**
 * Leave request form data for creating new leave requests
 */
export interface LeaveRequestFormData {
  pilot_id: string
  employee_number?: string
  rank?: PilotRank
  name?: string
  request_type: LeaveRequestType
  start_date: string
  end_date?: string | null
  reason?: string | null
  notes?: string | null
  submission_channel?: SubmissionChannel
}

/**
 * Leave request statistics
 */
export interface LeaveRequestStats {
  total: number
  pending: number
  approved: number
  denied: number
  withdrawn: number
}

/**
 * Get all leave requests (filtered from pilot_requests)
 */
export async function getAllLeaveRequests(
  filters?: Partial<PilotRequestFilters>
): Promise<ServiceResponse<LeaveRequest[]>> {
  return getAllPilotRequests({
    ...filters,
    request_category: ['LEAVE'],
  })
}

/**
 * Get leave request by ID
 */
export async function getLeaveRequestById(id: string): Promise<ServiceResponse<LeaveRequest>> {
  return getPilotRequestById(id)
}

/**
 * Get leave requests for a specific pilot
 */
export async function getPilotLeaveRequests(
  pilotId: string
): Promise<ServiceResponse<LeaveRequest[]>> {
  return getAllPilotRequests({
    pilot_id: pilotId,
    request_category: ['LEAVE'],
  })
}

/**
 * Create a leave request (server-side)
 */
export async function createLeaveRequestServer(
  data: LeaveRequestFormData
): Promise<ServiceResponse<LeaveRequest>> {
  return createPilotRequest({
    pilot_id: data.pilot_id,
    employee_number: data.employee_number ?? '',
    rank: data.rank ?? 'Captain',
    name: data.name ?? '',
    request_category: 'LEAVE',
    request_type: data.request_type,
    start_date: data.start_date,
    end_date: data.end_date || undefined,
    reason: data.reason || undefined,
    notes: data.notes || undefined,
    submission_channel: data.submission_channel ?? 'ADMIN_PORTAL',
  })
}

/**
 * Update a leave request (server-side)
 */
export async function updateLeaveRequestServer(
  id: string,
  data: Partial<LeaveRequestFormData>
): Promise<ServiceResponse<LeaveRequest>> {
  return updatePilotRequest(id, {
    request_type: data.request_type,
    start_date: data.start_date,
    end_date: data.end_date || undefined,
    reason: data.reason || undefined,
    notes: data.notes || undefined,
  })
}

/**
 * Update leave request status
 */
export async function updateLeaveRequestStatus(
  id: string,
  status: WorkflowStatus,
  reviewedBy?: string,
  comments?: string
): Promise<ServiceResponse<LeaveRequest>> {
  return updateRequestStatus(id, status, reviewedBy ?? 'system', comments)
}

/**
 * Delete a leave request
 */
export async function deleteLeaveRequest(id: string): Promise<ServiceResponse<void>> {
  return deletePilotRequest(id)
}

/**
 * Get leave request statistics
 */
export async function getLeaveRequestStats(): Promise<ServiceResponse<LeaveRequestStats>> {
  const result = await getAllPilotRequests({ request_category: ['LEAVE'] })

  if (!result.success || !result.data) {
    return { success: false, error: result.error }
  }

  const requests = result.data
  return {
    success: true,
    data: {
      total: requests.length,
      pending: requests.filter(
        (r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'IN_REVIEW'
      ).length,
      approved: requests.filter((r) => r.workflow_status === 'APPROVED').length,
      denied: requests.filter((r) => r.workflow_status === 'DENIED').length,
      withdrawn: requests.filter((r) => r.workflow_status === 'WITHDRAWN').length,
    },
  }
}

/**
 * Get pending leave requests
 */
export async function getPendingLeaveRequests(): Promise<ServiceResponse<LeaveRequest[]>> {
  return getAllPilotRequests({
    request_category: ['LEAVE'],
    status: ['SUBMITTED', 'IN_REVIEW'],
  })
}

/**
 * Check for leave conflicts (delegates to conflict detection service)
 */
export async function checkLeaveConflicts(
  pilotId: string,
  startDate: string,
  endDate?: string | null,
  rank: 'Captain' | 'First Officer' = 'Captain'
): Promise<
  ServiceResponse<{
    hasConflicts: boolean
    conflicts: import('@/lib/services/conflict-detection-service').Conflict[]
  }>
> {
  try {
    const request: RequestInput = {
      pilotId,
      rank,
      startDate,
      endDate: endDate ?? startDate,
      requestCategory: 'LEAVE',
    }

    const result = await detectConflicts(request)

    return {
      success: true,
      data: {
        hasConflicts: result.hasConflicts,
        conflicts: result.conflicts,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check conflicts',
    }
  }
}

/**
 * Get leave requests by roster period
 */
export async function getLeaveRequestsByRosterPeriod(
  rosterPeriod: string
): Promise<ServiceResponse<LeaveRequest[]>> {
  return getAllPilotRequests({
    roster_period: rosterPeriod,
    request_category: ['LEAVE'],
  })
}
