/**
 * Leave Service
 * Comprehensive CRUD operations for leave requests
 *
 * @version 2.0.0
 * @since 2025-10-17
 */

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from './audit-service'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

export interface LeaveRequest {
  id: string
  pilot_id: string | null
  request_type:
    | 'RDO'
    | 'SDO'
    | 'ANNUAL'
    | 'SICK'
    | 'LSL'
    | 'LWOP'
    | 'MATERNITY'
    | 'COMPASSIONATE'
    | null
  roster_period: string
  start_date: string
  end_date: string
  days_count: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  request_date?: string | null // Date when the request was made (separate from created_at)
  request_method?: 'EMAIL' | 'ORACLE' | 'LEAVE_BIDS' | 'SYSTEM' | null // How the request was submitted
  is_late_request?: boolean | null // Flag for requests with less than 21 days advance notice
  created_at: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comments?: string | null
  // Joined data
  pilot_name?: string
  employee_id?: string
  pilot_role?: 'Captain' | 'First Officer' | null
  reviewer_name?: string | null
}

export interface LeaveRequestFormData {
  pilot_id: string
  request_type: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE'
  start_date: string
  end_date: string
  request_date: string
  request_method: 'ORACLE' | 'EMAIL' | 'LEAVE_BIDS' | 'SYSTEM'
  reason?: string
  is_late_request?: boolean
}

export interface LeaveRequestStats {
  total: number
  pending: number
  approved: number
  denied: number
  byType: {
    RDO: number
    SDO: number
    ANNUAL: number
    SICK: number
    LSL: number
    LWOP: number
    MATERNITY: number
    COMPASSIONATE: number
  }
}

// Calculate days between two dates (inclusive)
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end dates
}

// Get all leave requests with pilot information
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  const supabase = await createClient()

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
      reviewer_name: request.reviewer?.name || null,
    })) as LeaveRequest[]
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getAllLeaveRequests',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'fetchAllLeaveRequests' },
    })
    throw error
  }
}

// Get a single leave request by ID
export async function getLeaveRequestById(requestId: string): Promise<LeaveRequest | null> {
  const supabase = await createClient()

  try {
    const { data: request, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('id', requestId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    if (!request) return null

    return {
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
      reviewer_name: request.reviewer?.name || null,
    } as LeaveRequest
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getLeaveRequestById',
      severity: ErrorSeverity.MEDIUM,
      metadata: { requestId },
    })
    throw error
  }
}

// Get leave requests for a specific pilot
export async function getPilotLeaveRequests(pilotId: string): Promise<LeaveRequest[]> {
  const supabase = await createClient()

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
      reviewer_name: request.reviewer?.name || null,
    })) as LeaveRequest[]
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getPilotLeaveRequests',
      severity: ErrorSeverity.MEDIUM,
      metadata: { pilotId },
    })
    throw error
  }
}

// Create a new leave request (server-side)
export async function createLeaveRequestServer(
  requestData: LeaveRequestFormData
): Promise<LeaveRequest> {
  const supabase = await createClient()

  try {
    // Calculate days count
    const daysCount = calculateDays(requestData.start_date, requestData.end_date)

    // Calculate roster period from start date
    const rosterPeriod = getRosterPeriodFromDate(new Date(requestData.start_date))

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        pilot_id: requestData.pilot_id,
        request_type: requestData.request_type,
        roster_period: rosterPeriod,
        start_date: requestData.start_date,
        end_date: requestData.end_date,
        days_count: daysCount,
        request_date: requestData.request_date,
        request_method: requestData.request_method,
        reason: requestData.reason,
        is_late_request: requestData.is_late_request || false,
        status: 'PENDING',
      })
      .select()
      .single()

    if (error) {
      // Check if error is a unique constraint violation
      if (error.code === '23505' && error.message.includes('leave_requests_pilot_dates_unique')) {
        const duplicateError = new Error(
          'A leave request for these dates already exists. Please check your existing requests or contact your supervisor.'
        )
        duplicateError.name = 'DuplicateLeaveRequestError'
        throw duplicateError
      }
      throw error
    }

    // Audit log the creation
    await createAuditLog({
      action: 'INSERT',
      tableName: 'leave_requests',
      recordId: data.id,
      newData: data,
      description: `Created ${data.request_type} leave request for pilot ID: ${data.pilot_id} (${data.start_date} to ${data.end_date})`,
    })

    return data as LeaveRequest
  } catch (error) {
    // Re-throw duplicate errors without additional logging
    if (error instanceof Error && error.name === 'DuplicateLeaveRequestError') {
      throw error
    }

    logError(error as Error, {
      source: 'leave-service:createLeaveRequestServer',
      severity: ErrorSeverity.HIGH,
      metadata: { pilotId: requestData.pilot_id, requestType: requestData.request_type },
    })
    throw error
  }
}

// Update leave request data (for editing)
export async function updateLeaveRequestServer(
  requestId: string,
  requestData: Partial<LeaveRequestFormData>
): Promise<LeaveRequest> {
  const supabase = await createClient()

  try {
    const updateData: any = { ...requestData }

    // Recalculate days if dates changed
    if (requestData.start_date && requestData.end_date) {
      updateData.days_count = calculateDays(requestData.start_date, requestData.end_date)
      updateData.roster_period = getRosterPeriodFromDate(new Date(requestData.start_date))
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    return data as LeaveRequest
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:updateLeaveRequestServer',
      severity: ErrorSeverity.HIGH,
      metadata: { requestId },
    })
    throw error
  }
}

/**
 * Update leave request status (approve/deny) - ATOMIC
 * Uses PostgreSQL function for transaction safety
 * Updates leave request and creates audit log atomically
 */
export async function updateLeaveRequestStatus(
  requestId: string,
  status: 'APPROVED' | 'DENIED',
  reviewedBy: string,
  reviewComments?: string
): Promise<{ success: boolean; message: string; requestId: string }> {
  const supabase = await createClient()

  try {
    // Use PostgreSQL function for atomic approval with audit log
    const { data, error } = await supabase.rpc('approve_leave_request', {
      p_request_id: requestId,
      p_reviewer_id: reviewedBy,
      p_status: status,
      p_comments: reviewComments || undefined,
    })

    if (error) {
      logError(new Error(`Failed to update leave request status: ${error.message}`), {
        source: 'leave-service:updateLeaveRequestStatus',
        severity: ErrorSeverity.CRITICAL,
        metadata: { requestId, status, reviewedBy, error },
      })
      throw new Error(`Failed to update leave request status: ${error.message}`)
    }

    // Extract result
    const result = data as any
    if (!result) {
      throw new Error('Unexpected response from database function')
    }

    logInfo('Leave request status updated successfully', {
      source: 'leave-service:updateLeaveRequestStatus',
      metadata: { requestId, status, message: result.message },
    })

    return {
      success: result.success,
      message: result.message,
      requestId: result.request_id,
    }
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:updateLeaveRequestStatus',
      severity: ErrorSeverity.CRITICAL,
      metadata: { requestId, status, reviewedBy },
    })
    throw error
  }
}

// Delete a leave request (only if pending)
export async function deleteLeaveRequest(requestId: string): Promise<void> {
  const supabase = await createClient()

  try {
    // First check if the request is pending
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('status')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError

    if (request.status !== 'PENDING') {
      throw new Error('Cannot delete a leave request that has already been reviewed')
    }

    const { error } = await supabase.from('leave_requests').delete().eq('id', requestId)

    if (error) throw error
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:deleteLeaveRequest',
      severity: ErrorSeverity.HIGH,
      metadata: { requestId },
    })
    throw error
  }
}

// Get leave request statistics
export async function getLeaveRequestStats(): Promise<LeaveRequestStats> {
  const supabase = await createClient()

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select('status, request_type')

    if (error) throw error

    const stats = (requests || []).reduce(
      (acc, request) => {
        acc.total++

        // Count by status
        if (request.status === 'PENDING') acc.pending++
        else if (request.status === 'APPROVED') acc.approved++
        else if (request.status === 'DENIED') acc.denied++

        // Count by type
        acc.byType[request.request_type as keyof typeof acc.byType]++

        return acc
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        byType: {
          RDO: 0,
          SDO: 0,
          ANNUAL: 0,
          SICK: 0,
          LSL: 0,
          LWOP: 0,
          MATERNITY: 0,
          COMPASSIONATE: 0,
        },
      }
    )

    return stats
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getLeaveRequestStats',
      severity: ErrorSeverity.MEDIUM,
      metadata: { operation: 'calculateStats' },
    })
    throw error
  }
}

// Get pending leave requests (for manager/admin approval)
export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  const supabase = await createClient()

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        )
      `
      )
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true }) // Oldest first for review

    if (error) throw error

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
    })) as LeaveRequest[]
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getPendingLeaveRequests',
      severity: ErrorSeverity.HIGH,
      metadata: { operation: 'fetchPendingRequests' },
    })
    throw error
  }
}

// Check for leave conflicts (same pilot, overlapping dates)
export async function checkLeaveConflicts(
  pilotId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<LeaveRequest[]> {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        )
      `
      )
      .eq('pilot_id', pilotId)
      .in('status', ['PENDING', 'APPROVED'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

    if (excludeRequestId) {
      query = query.neq('id', excludeRequestId)
    }

    const { data: conflicts, error } = await query

    if (error) throw error

    return (conflicts || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
    })) as LeaveRequest[]
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:checkLeaveConflicts',
      severity: ErrorSeverity.LOW,
      metadata: { pilotId, startDate, endDate },
    })
    return []
  }
}

// Get leave requests for a specific roster period
export async function getLeaveRequestsByRosterPeriod(
  rosterPeriod: string
): Promise<LeaveRequest[]> {
  const supabase = await createClient()

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(
        `
        *,
        pilots (
          first_name,
          middle_name,
          last_name,
          employee_id,
          role
        ),
        reviewer:an_users!reviewed_by (
          name
        )
      `
      )
      .eq('roster_period', rosterPeriod)
      .order('start_date', { ascending: true })

    if (error) throw error

    return (requests || []).map((request) => ({
      ...request,
      pilot_name: request.pilots
        ? `${request.pilots.first_name} ${request.pilots.middle_name ? `${request.pilots.middle_name} ` : ''}${request.pilots.last_name}`
        : 'Unknown Pilot',
      employee_id: request.pilots?.employee_id || 'N/A',
      pilot_role: request.pilots?.role || null,
      reviewer_name: request.reviewer?.name || null,
    })) as LeaveRequest[]
  } catch (error) {
    logError(error as Error, {
      source: 'leave-service:getLeaveRequestsByRosterPeriod',
      severity: ErrorSeverity.MEDIUM,
      metadata: { rosterPeriod },
    })
    throw error
  }
}

/**
 * Helper function to calculate roster period from date
 * 28-day cycles starting from known anchor: RP12/2025 = 2025-10-11
 */
function getRosterPeriodFromDate(date: Date): string {
  // Validate input date
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    logError(new Error('Invalid date provided to roster calculation'), {
      source: 'LeaveService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getRosterPeriodFromDate',
        date: String(date),
      },
    })
    throw new Error('Invalid date for roster period calculation')
  }

  const ROSTER_DURATION = 28
  const KNOWN_ROSTER = {
    number: 12,
    year: 2025,
    startDate: new Date('2025-10-11'),
  }

  const daysSinceKnown = Math.floor(
    (date.getTime() - KNOWN_ROSTER.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  let number = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollovers
  while (number > 13) {
    number -= 13
    year++
  }
  while (number < 1) {
    number += 13
    year--
  }

  // Validate output before returning
  if (isNaN(number) || number <= 0 || number > 13) {
    logError(new Error('Invalid roster period calculated'), {
      source: 'LeaveService',
      severity: ErrorSeverity.HIGH,
      metadata: {
        operation: 'getRosterPeriodFromDate',
        number,
        year,
        inputDate: date.toISOString(),
      },
    })
    throw new Error('Roster period calculation produced invalid result')
  }

  return `RP${number}/${year}`
}
