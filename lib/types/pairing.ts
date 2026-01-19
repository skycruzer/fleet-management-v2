/**
 * Pairing Types for Certification Renewal Planning
 * Author: Maurice Rondeau
 *
 * TypeScript types for the Captain/First Officer pairing system.
 * Flight and Simulator checks require crew pairing (90-day window).
 * Medical checks are individual (28-day window).
 */

/**
 * Pairing status for renewal plans
 */
export type PairingStatus = 'paired' | 'unpaired_solo' | 'not_applicable'

/**
 * Categories that require crew pairing
 */
export const PAIRING_REQUIRED_CATEGORIES = ['Flight Checks', 'Simulator Checks'] as const
export type PairingRequiredCategory = (typeof PAIRING_REQUIRED_CATEGORIES)[number]

/**
 * Categories that are individual scheduling
 */
export const INDIVIDUAL_CATEGORIES = ['Pilot Medical', 'Ground Courses Refresher'] as const
export type IndividualCategory = (typeof INDIVIDUAL_CATEGORIES)[number]

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
 * Pilot info for pairing context
 */
export interface PilotForPairing {
  id: string
  first_name: string
  last_name: string
  employee_id: string
  role: 'Captain' | 'First Officer'
  seniority_number: number
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
  }
  firstOfficer: {
    pilotId: string
    renewalPlanId: string
    name: string
    employeeId: string
    expiryDate: string
    seniorityNumber: number
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
}
