/**
 * Conflict Detection Service
 *
 * Detects conflicts in pilot requests including:
 * - Overlapping requests for same pilot
 * - Crew availability threshold violations
 * - Cross-request conflicts
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from './logging-service'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Conflict types
 */
export type ConflictType =
  | 'OVERLAPPING_REQUEST' // Same pilot has overlapping request
  | 'CREW_BELOW_MINIMUM' // Approval would cause crew < 10
  | 'MULTIPLE_PENDING' // Multiple pilots requesting same dates
  | 'DUPLICATE_REQUEST' // Duplicate request for same pilot/dates

/**
 * Conflict severity levels
 */
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Individual conflict detail
 */
export interface Conflict {
  type: ConflictType
  severity: ConflictSeverity
  message: string
  details: Record<string, any>
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflicts: boolean
  conflicts: Conflict[]
  canApprove: boolean
  warnings: string[]
  crewImpact?: {
    captainsBefore: number
    captainsAfter: number
    firstOfficersBefore: number
    firstOfficersAfter: number
    belowMinimum: boolean
  }
}

/**
 * Request input for conflict detection
 */
export interface RequestInput {
  pilotId: string
  rank: 'Captain' | 'First Officer'
  startDate: string
  endDate: string | null
  requestCategory: 'LEAVE' | 'FLIGHT' | 'LEAVE_BID'
  requestId?: string // For updates, exclude this request from checks
}

// ============================================================================
// Constants
// ============================================================================

const MINIMUM_CAPTAINS = 10
const MINIMUM_FIRST_OFFICERS = 10

// ============================================================================
// Main Conflict Detection Functions
// ============================================================================

/**
 * Detect all conflicts for a pilot request
 *
 * @param requestInput - Request details to check
 * @returns Comprehensive conflict detection result
 */
export async function detectConflicts(
  requestInput: RequestInput
): Promise<ConflictDetectionResult> {
  try {
    logger.info('Detecting conflicts for request', {
      pilotId: requestInput.pilotId,
      startDate: requestInput.startDate,
      endDate: requestInput.endDate,
    })

    const conflicts: Conflict[] = []
    const warnings: string[] = []

    // Check for overlapping requests
    const overlapConflicts = await checkOverlappingRequests(requestInput)
    conflicts.push(...overlapConflicts)

    // Check for crew availability violations (only for LEAVE requests)
    if (requestInput.requestCategory === 'LEAVE') {
      const availabilityResult = await checkCrewAvailability(requestInput)
      if (availabilityResult.conflicts.length > 0) {
        conflicts.push(...availabilityResult.conflicts)
      }
      if (availabilityResult.warnings.length > 0) {
        warnings.push(...availabilityResult.warnings)
      }
    }

    // Check for duplicate requests
    const duplicateConflicts = await checkDuplicateRequests(requestInput)
    conflicts.push(...duplicateConflicts)

    // Determine if request can be approved despite conflicts
    const canApprove = !conflicts.some((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH')

    // Get crew impact
    const crewImpact = await calculateCrewImpact(requestInput)

    const result: ConflictDetectionResult = {
      hasConflicts: conflicts.length > 0,
      conflicts,
      canApprove,
      warnings,
      crewImpact,
    }

    logger.info('Conflict detection complete', {
      hasConflicts: result.hasConflicts,
      conflictCount: conflicts.length,
      canApprove: result.canApprove,
    })

    return result
  } catch (error: any) {
    logger.error('Error detecting conflicts', { error })
    return {
      hasConflicts: false,
      conflicts: [],
      canApprove: true,
      warnings: ['Failed to perform conflict detection'],
    }
  }
}

// ============================================================================
// Individual Conflict Checks
// ============================================================================

/**
 * Check for overlapping requests for the same pilot
 *
 * @param requestInput - Request details
 * @returns List of overlapping request conflicts
 */
export async function checkOverlappingRequests(requestInput: RequestInput): Promise<Conflict[]> {
  const supabase = await createClient()
  const conflicts: Conflict[] = []

  try {
    const { data: existingRequests, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('pilot_id', requestInput.pilotId)
      .in('workflow_status', ['SUBMITTED', 'IN_REVIEW', 'APPROVED'])
      .or(
        `start_date.lte.${requestInput.endDate || requestInput.startDate},end_date.gte.${requestInput.startDate}`
      )

    if (error) {
      logger.error('Error checking overlapping requests', { error })
      return conflicts
    }

    // Filter out the current request if updating
    const overlapping = (existingRequests || []).filter((req) => {
      if (requestInput.requestId && req.id === requestInput.requestId) {
        return false
      }

      // Only check conflicts within the same request category
      // LEAVE requests conflict with other LEAVE requests
      // FLIGHT (RDO/SDO) requests conflict with other FLIGHT requests
      // LEAVE_BID requests conflict with other LEAVE_BID requests
      if (req.request_category !== requestInput.requestCategory) {
        return false
      }

      // Check for date overlap
      const existingStart = new Date(req.start_date)
      const existingEnd = req.end_date ? new Date(req.end_date) : existingStart
      const newStart = new Date(requestInput.startDate)
      const newEnd = requestInput.endDate ? new Date(requestInput.endDate) : newStart

      return existingStart <= newEnd && existingEnd >= newStart
    })

    if (overlapping.length > 0) {
      overlapping.forEach((req) => {
        conflicts.push({
          type: 'OVERLAPPING_REQUEST',
          severity: 'CRITICAL',
          message: `Pilot already has a ${req.workflow_status.toLowerCase()} ${req.request_type} request for overlapping dates`,
          details: {
            existingRequestId: req.id,
            existingStartDate: req.start_date,
            existingEndDate: req.end_date,
            existingStatus: req.workflow_status,
            existingType: req.request_type,
          },
        })
      })
    }
  } catch (error: any) {
    logger.error('Error in checkOverlappingRequests', { error })
  }

  return conflicts
}

/**
 * Check if approving request would violate crew availability thresholds
 *
 * @param requestInput - Request details
 * @returns Crew availability conflicts and warnings
 */
export async function checkCrewAvailability(
  requestInput: RequestInput
): Promise<{ conflicts: Conflict[]; warnings: string[] }> {
  const supabase = await createClient()
  const conflicts: Conflict[] = []
  const warnings: string[] = []

  try {
    // Get all active pilots of the same rank
    const { data: pilots, error: pilotsError } = await supabase
      .from('pilots')
      .select('id, rank')
      .eq('rank', requestInput.rank)
      .eq('status', 'Active')

    if (pilotsError || !pilots) {
      logger.error('Error fetching pilots for availability check', { error: pilotsError })
      return { conflicts, warnings }
    }

    const totalCrew = pilots.length

    // Get all approved leave requests for same dates and rank
    const { data: approvedLeave, error: leaveError } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('workflow_status', 'APPROVED')
      .eq('request_category', 'LEAVE')
      .eq('rank', requestInput.rank)
      .or(
        `start_date.lte.${requestInput.endDate || requestInput.startDate},end_date.gte.${requestInput.startDate}`
      )

    if (leaveError) {
      logger.error('Error fetching approved leave', { error: leaveError })
      return { conflicts, warnings }
    }

    // Count unique pilots on leave
    const uniquePilotsOnLeave = new Set(approvedLeave?.map((req) => req.pilot_id) || [])
    const pilotsOnLeave = uniquePilotsOnLeave.size
    const availableCrew = totalCrew - pilotsOnLeave - 1 // -1 for this request

    const minimumRequired =
      requestInput.rank === 'Captain' ? MINIMUM_CAPTAINS : MINIMUM_FIRST_OFFICERS

    // Critical: Would go below minimum
    if (availableCrew < minimumRequired) {
      conflicts.push({
        type: 'CREW_BELOW_MINIMUM',
        severity: 'CRITICAL',
        message: `Approving this request would leave only ${availableCrew} ${requestInput.rank}s available (minimum: ${minimumRequired})`,
        details: {
          totalCrew,
          pilotsOnLeave,
          availableAfterApproval: availableCrew,
          minimumRequired,
          shortfall: minimumRequired - availableCrew,
        },
      })
    }
    // Warning: Would be exactly at minimum
    else if (availableCrew === minimumRequired) {
      warnings.push(
        `Approving this request would leave exactly ${minimumRequired} ${requestInput.rank}s available (minimum threshold)`
      )
    }
    // Medium warning: Close to minimum
    else if (availableCrew === minimumRequired + 1) {
      warnings.push(
        `Approving this request would leave only ${availableCrew} ${requestInput.rank}s available (1 above minimum)`
      )
    }
  } catch (error: any) {
    logger.error('Error in checkCrewAvailability', { error })
  }

  return { conflicts, warnings }
}

/**
 * Check for duplicate requests (same pilot, same dates, same type)
 *
 * @param requestInput - Request details
 * @returns List of duplicate request conflicts
 */
export async function checkDuplicateRequests(requestInput: RequestInput): Promise<Conflict[]> {
  const supabase = await createClient()
  const conflicts: Conflict[] = []

  try {
    const { data: duplicates, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('pilot_id', requestInput.pilotId)
      .eq('start_date', requestInput.startDate)
      .eq('request_category', requestInput.requestCategory)
      .in('workflow_status', ['SUBMITTED', 'IN_REVIEW', 'APPROVED'])

    if (error) {
      logger.error('Error checking duplicate requests', { error })
      return conflicts
    }

    // Filter out the current request if updating
    const actualDuplicates = (duplicates || []).filter((req) => {
      if (requestInput.requestId && req.id === requestInput.requestId) {
        return false
      }
      // Check if end date also matches (if applicable)
      if (requestInput.endDate && req.end_date) {
        return req.end_date === requestInput.endDate
      }
      return true
    })

    if (actualDuplicates.length > 0) {
      actualDuplicates.forEach((req) => {
        conflicts.push({
          type: 'DUPLICATE_REQUEST',
          severity: 'HIGH',
          message: `Duplicate request already exists for the same dates and type`,
          details: {
            existingRequestId: req.id,
            existingStatus: req.workflow_status,
            existingType: req.request_type,
            submissionDate: req.submission_date,
          },
        })
      })
    }
  } catch (error: any) {
    logger.error('Error in checkDuplicateRequests', { error })
  }

  return conflicts
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate crew impact of approving this request
 *
 * @param requestInput - Request details
 * @returns Crew availability before and after approval
 */
async function calculateCrewImpact(requestInput: RequestInput) {
  const supabase = await createClient()

  try {
    // Get total active captains and first officers
    const { data: pilots } = await supabase.from('pilots').select('role').eq('is_active', true)

    if (!pilots) return undefined

    const totalCaptains = pilots.filter((p) => p.role === 'Captain').length
    const totalFirstOfficers = pilots.filter((p) => p.role === 'First Officer').length

    // Get approved leave for the dates
    const { data: approvedLeave } = await supabase
      .from('pilot_requests')
      .select('*')
      .eq('workflow_status', 'APPROVED')
      .eq('request_category', 'LEAVE')
      .or(
        `start_date.lte.${requestInput.endDate || requestInput.startDate},end_date.gte.${requestInput.startDate}`
      )

    const captainsOnLeave = new Set(
      approvedLeave?.filter((r) => r.rank === 'Captain').map((r) => r.pilot_id) || []
    ).size

    const fosOnLeave = new Set(
      approvedLeave?.filter((r) => r.rank === 'First Officer').map((r) => r.pilot_id) || []
    ).size

    const captainsBefore = totalCaptains - captainsOnLeave
    const fosBefore = totalFirstOfficers - fosOnLeave

    const captainsAfter = requestInput.rank === 'Captain' ? captainsBefore - 1 : captainsBefore
    const fosAfter = requestInput.rank === 'First Officer' ? fosBefore - 1 : fosBefore

    return {
      captainsBefore,
      captainsAfter,
      firstOfficersBefore: fosBefore,
      firstOfficersAfter: fosAfter,
      belowMinimum: captainsAfter < MINIMUM_CAPTAINS || fosAfter < MINIMUM_FIRST_OFFICERS,
    }
  } catch (error: any) {
    logger.error('Error calculating crew impact', { error })
    return undefined
  }
}

/**
 * Get conflict severity level for display
 *
 * @param severity - Conflict severity
 * @returns Color and icon for display
 */
export function getConflictSeverityDisplay(severity: ConflictSeverity): {
  color: string
  icon: string
  label: string
} {
  const displays = {
    LOW: { color: 'text-blue-600', icon: 'ℹ️', label: 'Info' },
    MEDIUM: { color: 'text-yellow-600', icon: '⚠️', label: 'Warning' },
    HIGH: { color: 'text-orange-600', icon: '⚠️', label: 'High' },
    CRITICAL: { color: 'text-red-600', icon: '🚨', label: 'Critical' },
  }

  return displays[severity]
}
