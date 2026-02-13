/**
 * Pairing Types for Certification Renewal Planning
 * Author: Maurice Rondeau
 *
 * TypeScript types for the Captain/First Officer pairing system.
 * Flight and Simulator checks require crew pairing (90-day window).
 * Medical checks are individual (28-day window).
 *
 * RHS/Training/Examiner captains perform simulator checks from the
 * right-hand seat. The pairing system tracks seat position and
 * captain qualification role for these special cases.
 */

/**
 * Pairing status for renewal plans
 */
export type PairingStatus = 'paired' | 'unpaired_solo' | 'not_applicable'

/**
 * Seat position for simulator checks.
 * RHS/Training/Examiner captains operate from the right seat.
 */
export type SeatPosition = 'left_seat' | 'right_seat'

/**
 * Captain qualification role relevant to renewal planning.
 * Determines seat position for simulator checks.
 */
export type CaptainRole = 'line_captain' | 'training_captain' | 'examiner' | 'rhs_captain'

/**
 * All captain-type roles that can pair with First Officers.
 * Used in the pairing algorithm to group all captains regardless of qualification.
 */
export const CAPTAIN_ROLES = [
  'Captain',
  'RHS Captain',
  'Training Captain',
  'Examiner Captain',
] as const
export type CaptainRoleLabel = (typeof CAPTAIN_ROLES)[number]

/**
 * Simulator check categories where seat position matters
 */
export const SIMULATOR_CATEGORIES = ['Simulator Checks'] as const

/**
 * Check codes for simulator checks (used to determine seat position)
 */
export const SIMULATOR_CHECK_CODES = ['B767_COMP', 'B767_IRR'] as const

/**
 * Categories that require crew pairing
 */
export const PAIRING_REQUIRED_CATEGORIES = ['Flight Checks', 'Simulator Checks'] as const
export type PairingRequiredCategory = (typeof PAIRING_REQUIRED_CATEGORIES)[number]

/**
 * Categories that are individual scheduling (no pairing required)
 * Note: Medical removed from planning - 28-day window too short for advance scheduling
 */
export const INDIVIDUAL_CATEGORIES = ['Ground Courses Refresher'] as const
export type IndividualCategory = (typeof INDIVIDUAL_CATEGORIES)[number]

/**
 * Categories that should NOT be included in renewal planning
 * Medical has a 28-day window - too short for advance planning, handle via urgent scheduling
 */
export const EXCLUDED_FROM_PLANNING = ['Pilot Medical'] as const
export type ExcludedCategory = (typeof EXCLUDED_FROM_PLANNING)[number]

/**
 * Renewal window configuration by category
 */
export const RENEWAL_WINDOWS = {
  'Pilot Medical': 28, // 28-day window
  'Flight Checks': 90, // 90-day window, pairing required
  'Simulator Checks': 90, // 90-day window, pairing required
  'Ground Courses Refresher': 60, // 60-day window
} as const

/**
 * Check if a category requires crew pairing
 */
export function requiresPairing(category: string): boolean {
  return PAIRING_REQUIRED_CATEGORIES.includes(category as PairingRequiredCategory)
}

/**
 * Check if a category should be included in renewal planning
 * Medical is excluded due to 28-day window being too short for advance planning
 */
export function isPlannable(category: string): boolean {
  return !EXCLUDED_FROM_PLANNING.includes(category as ExcludedCategory)
}

/**
 * Pilot info for pairing context
 */
export interface PilotForPairing {
  id: string
  first_name: string
  last_name: string
  employee_id: string
  role: 'Captain' | 'First Officer' | 'RHS Captain' | 'Training Captain' | 'Examiner Captain'
  seniority_number: number
  captain_qualifications?: {
    line_captain?: boolean
    training_captain?: boolean
    examiner?: boolean
    rhs_captain_expiry?: string
  } | null
}

/**
 * Check if a role string represents any captain-type role
 */
export function isCaptainRole(role: string): boolean {
  return role === 'Captain' || CAPTAIN_ROLES.includes(role as CaptainRoleLabel)
}

/**
 * Certification info for pairing
 */
export interface CertificationForPairing {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date: string
  category: string
  pilot: PilotForPairing
}

/**
 * Represents a paired crew (Captain + First Officer)
 */
export interface PairedCrew {
  id: string // Unique pair group ID
  captain: {
    pilotId: string
    renewalPlanId: string
    name: string
    employeeId: string
    expiryDate: string
    seniorityNumber: number
    captainRole?: CaptainRole
    seatPosition?: SeatPosition
  }
  firstOfficer: {
    pilotId: string
    renewalPlanId: string
    name: string
    employeeId: string
    expiryDate: string
    seniorityNumber: number
    seatPosition?: SeatPosition
  }
  category: PairingRequiredCategory
  plannedRosterPeriod: string
  plannedDate: string
  renewalWindowOverlap: {
    start: string
    end: string
    days: number
  }
  status: 'paired'
}

/**
 * Represents an unpaired pilot (solo scheduling)
 */
export interface UnpairedPilot {
  pilotId: string
  renewalPlanId: string
  name: string
  employeeId: string
  role: 'Captain' | 'First Officer'
  expiryDate: string
  daysUntilExpiry: number
  category: PairingRequiredCategory
  plannedRosterPeriod: string
  plannedDate: string
  reason: UnpairedReason
  status: 'unpaired_solo'
  urgency: 'critical' | 'high' | 'normal'
  captainRole?: CaptainRole
  seatPosition?: SeatPosition
}

/**
 * Reasons why a pilot could not be paired
 */
export type UnpairedReason =
  | 'no_matching_role' // No available Captain/FO with overlapping window
  | 'window_mismatch' // Renewal windows don't overlap enough
  | 'capacity_full' // All eligible periods at capacity
  | 'urgent_solo' // Expiring too soon, scheduled solo for safety
  | 'manual_override' // Admin manually assigned solo

/**
 * Pairing suggestion before committing
 */
export interface PairingSuggestion {
  captain: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
    captainRole?: CaptainRole
  }
  firstOfficer: {
    pilotId: string
    name: string
    employeeId: string
    expiryDate: string
    windowStart: string
    windowEnd: string
  }
  category: string
  suggestedPeriod: string
  suggestedDate: string
  overlapDays: number
  score: number // Pairing quality score (higher = better match)
}

/**
 * Statistics for pairing in a renewal plan
 */
export interface PairingStatistics {
  totalPairs: number
  totalUnpaired: number
  byCategory: {
    category: string
    pairsCount: number
    unpairedCount: number
    captainsUnpaired: number
    firstOfficersUnpaired: number
  }[]
  urgentUnpaired: number // Count of unpaired with < 30 days
  averageOverlapDays: number
  rhsCheckCount: number // Count of right-hand-seat simulator checks
  captainRoleBreakdown: {
    lineCaptains: number
    trainingCaptains: number
    examiners: number
    rhsCaptains: number
  }
}

/**
 * Result of pairing algorithm
 */
export interface PairingResult {
  pairs: PairedCrew[]
  unpaired: UnpairedPilot[]
  statistics: PairingStatistics
  warnings: string[]
}

/**
 * Options for pairing algorithm
 */
export interface PairingOptions {
  /** Minimum overlap days required for pairing (default: 7) */
  minOverlapDays?: number
  /** Auto-schedule urgent pilots solo if no pair found (default: true) */
  autoScheduleUrgent?: boolean
  /** Days threshold for "urgent" status (default: 30) */
  urgentThresholdDays?: number
  /** Specific roster periods to exclude (e.g., holidays) */
  excludePeriods?: string[]
  /** Filter captains by qualification role (e.g., ['line_captain', 'training_captain']) */
  captainRoles?: string[]
}

/**
 * Determine the captain's qualification role for renewal planning.
 * Priority: examiner > training_captain > rhs_captain > line_captain
 * Higher-priority roles imply RHS capability.
 */
export function determineCaptainRole(
  qualifications: PilotForPairing['captain_qualifications']
): CaptainRole {
  if (!qualifications) return 'line_captain'
  if (qualifications.examiner) return 'examiner'
  if (qualifications.training_captain) return 'training_captain'
  if (qualifications.rhs_captain_expiry) {
    const expiry = new Date(qualifications.rhs_captain_expiry)
    if (expiry > new Date()) return 'rhs_captain'
  }
  return 'line_captain'
}

/**
 * Determine seat position for a pilot's simulator check.
 * Training captains, examiners, and RHS captains operate from the right seat
 * for simulator checks. All others use the left seat.
 */
export function determineSeatPosition(
  role: 'Captain' | 'First Officer',
  captainRole: CaptainRole | undefined,
  category: string
): SeatPosition | undefined {
  // Only simulator checks have seat position significance
  if (!SIMULATOR_CATEGORIES.includes(category as (typeof SIMULATOR_CATEGORIES)[number])) {
    return undefined
  }

  // First Officers always operate from the right seat (standard position)
  if (role === 'First Officer') return 'right_seat'

  // Captains: RHS/training/examiner go right seat, line captains go left seat
  if (captainRole && captainRole !== 'line_captain') return 'right_seat'

  return 'left_seat'
}
