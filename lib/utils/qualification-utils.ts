/**
 * CAPTAIN QUALIFICATION UTILITIES
 *
 * ========================================
 * BUSINESS RULES: CAPTAIN QUALIFICATIONS & SENIORITY
 * ========================================
 *
 * CRITICAL AVIATION OPERATIONS CONCEPT:
 *
 * Captain qualifications determine which pilots can perform specific duties
 * beyond standard flight operations. These include training, examining, and
 * special operational authorizations. This system manages and tracks these
 * qualifications with expiry-based currency tracking.
 *
 * WHY QUALIFICATION TRACKING?
 * - Regulatory compliance (FAA/CASA requirements)
 * - Training department resource allocation
 * - Examiner availability for check rides
 * - Operational flexibility and coverage
 * - Insurance and liability management
 *
 * ========================================
 * CAPTAIN QUALIFICATION TYPES
 * ========================================
 *
 * LINE CAPTAIN (Boolean):
 * - DEFINITION: Standard captain qualification for normal line operations
 * - REQUIREMENTS: Type rating + minimum flight hours + proficiency check
 * - AUTHORITY: Can command aircraft on regular scheduled flights
 * - PREREQUISITE: Required before obtaining other qualifications
 * - NO EXPIRY: Boolean flag (either qualified or not)
 *
 * TRAINING CAPTAIN / TRI (Boolean):
 * - DEFINITION: Type Rating Instructor qualification
 * - REQUIREMENTS: Line captain + training course + examiner endorsement
 * - AUTHORITY: Can conduct initial and recurrent training
 * - OPERATIONS: Simulator and aircraft training sessions
 * - SCHEDULE: Training department coordinates availability
 * - NO EXPIRY: Boolean flag (periodic revalidation required)
 *
 * EXAMINER / TRE (Boolean):
 * - DEFINITION: Type Rating Examiner qualification
 * - REQUIREMENTS: Training captain + examiner course + regulator approval
 * - AUTHORITY: Can conduct proficiency checks and skill tests
 * - OPERATIONS: Final assessment for licensing and recurrency
 * - REGULATORY: Subject to oversight by aviation authority
 * - NO EXPIRY: Boolean flag (periodic revalidation required)
 *
 * RHS CAPTAIN (Date-Based):
 * - DEFINITION: Right-Hand Seat captain qualification
 * - REQUIREMENTS: Line captain + specific training + check ride
 * - AUTHORITY: Can operate from right seat (normally FO position)
 * - USE CASES: Training, standardization, operational flexibility
 * - EXPIRY: Date-based currency (typically 6-12 months)
 * - RENEWAL: Requires recurrent check ride
 *
 * ========================================
 * SENIORITY SYSTEM
 * ========================================
 *
 * SENIORITY NUMBER:
 * - Based on commencement_date (hire date)
 * - Lower number = Higher seniority (1 = most senior)
 * - Range: 1 to N (where N = total pilots)
 * - CRITICAL: Used for leave request prioritization
 *
 * SENIORITY IMPACT:
 * - Leave request approval (higher seniority = higher priority)
 * - Roster preferences and bidding
 * - Training slot allocation
 * - Upgrade opportunities
 * - Layover accommodations
 *
 * SENIORITY CALCULATION:
 * - Sorted by commencement_date (ascending)
 * - Ties broken by hire timestamp (if available)
 * - Numbers updated when pilots join/leave fleet
 * - Maintained consistently across all systems
 *
 * ========================================
 * QUALIFICATION DATA STRUCTURE
 * ========================================
 *
 * STORAGE FORMAT (JSONB in Database):
 * ```json
 * {
 *   "line_captain": true,           // Boolean
 *   "training_captain": true,       // Boolean (TRI)
 *   "examiner": false,              // Boolean (TRE)
 *   "rhs_captain_expiry": "2025-12-31"  // ISO date string
 * }
 * ```
 *
 * FLEXIBLE DESIGN:
 * - JSONB allows schema evolution without migrations
 * - Can add new qualification types easily
 * - Null-safe handling for missing fields
 * - Backwards compatible with legacy data
 *
 * ========================================
 * RHS CAPTAIN EXPIRY RULES
 * ========================================
 *
 * STATUS THRESHOLDS (Similar to Certifications):
 * - EXPIRED (Red): expiry_date < today → qualification invalid
 * - EXPIRING (Yellow): expiry_date ≤ 30 days → renewal urgent
 * - CURRENT (Green): expiry_date > 30 days → qualification valid
 * - NOT SET (Gray): no expiry_date → qualification not held
 *
 * CALCULATION LOGIC:
 * 1. Check if rhs_captain_expiry field exists
 * 2. Parse ISO date string to Date object
 * 3. Calculate days difference from today
 * 4. Apply threshold rules for status
 *
 * OPERATIONAL IMPACT:
 * - Expired RHS: Cannot operate from right seat
 * - Does NOT affect normal left-seat operations
 * - Training department notified at 60 days
 * - Automatic alerts at 30 days (yellow status)
 *
 * ========================================
 * BUSINESS USE CASES
 * ========================================
 *
 * TRAINING SCHEDULING:
 * - Find all training captains: isTrainingCaptain()
 * - Check availability for training sessions
 * - Allocate instructors to student pilots
 * - Balance training workload across TRIs
 *
 * EXAMINER ALLOCATION:
 * - Find all examiners: isExaminer()
 * - Schedule proficiency checks
 * - Ensure examiner availability for licensing
 * - Regulatory compliance for check rides
 *
 * LEAVE REQUEST PRIORITIZATION:
 * - Compare seniority_number (lower = higher priority)
 * - Used in leave-eligibility-service.ts
 * - Ensures fair and consistent leave approval
 * - Prevents seniority disputes
 *
 * QUALIFICATION BADGES (UI):
 * - Display pilot capabilities at a glance
 * - Visual indicators in pilot cards/profiles
 * - Filter pilots by qualifications
 * - Quick identification for operations team
 *
 * COMPLIANCE REPORTING:
 * - Track expiring RHS qualifications
 * - Ensure adequate training captain coverage
 * - Monitor examiner availability
 * - Audit trail for regulatory inspections
 *
 * ========================================
 * EDGE CASES & SPECIAL SCENARIOS
 * ========================================
 *
 * NULL QUALIFICATIONS:
 * - Pilot record exists but qualifications field is null
 * - All qualification checks return false
 * - May indicate First Officer (not Captain)
 * - Data migration scenario handled gracefully
 *
 * MISSING RHS EXPIRY:
 * - Qualification exists but rhs_captain_expiry is null
 * - Interpreted as "not qualified for RHS"
 * - Gray status (not applicable)
 * - No expiry warnings generated
 *
 * FIRST OFFICERS:
 * - captain_qualifications field should be null
 * - All qualification checks return false
 * - Seniority number still applies for leave requests
 * - May become Captain via upgrade process
 *
 * RECENTLY UPGRADED:
 * - New Captain with no special qualifications yet
 * - line_captain = true (after upgrade check)
 * - Other qualifications acquired over time
 * - RHS typically obtained 6-12 months post-upgrade
 *
 * DEMOTED/DOWNGRADED:
 * - Rare scenario (medical, performance issues)
 * - Qualifications may be revoked
 * - Boolean flags set to false
 * - Seniority number typically retained
 *
 * @module lib/utils/qualification-utils
 * @version 2.0.0
 * @created 2025-10-17
 * @updated 2025-10-17 - Comprehensive business rule documentation added
 */

import type { CaptainQualifications, CaptainQualificationSummary } from '../../types/pilot'
import { parseISODateString } from './type-guards'

/**
 * Checks if a pilot has line captain qualification
 *
 * @param qualifications - The captain qualifications object
 * @returns True if the pilot is a line captain
 *
 * @example
 * ```typescript
 * if (isLineCaptain(pilot.captain_qualifications)) {
 *   console.log('Pilot is qualified as line captain')
 * }
 * ```
 */
export function isLineCaptain(qualifications: CaptainQualifications | null | undefined): boolean {
  return qualifications?.line_captain === true
}

/**
 * Checks if a pilot has training captain (TRI) qualification
 *
 * @param qualifications - The captain qualifications object
 * @returns True if the pilot is a training captain
 *
 * @example
 * ```typescript
 * if (isTrainingCaptain(pilot.captain_qualifications)) {
 *   console.log('Pilot can conduct training')
 * }
 * ```
 */
export function isTrainingCaptain(
  qualifications: CaptainQualifications | null | undefined
): boolean {
  return qualifications?.training_captain === true
}

/**
 * Checks if a pilot has examiner (TRE) qualification
 *
 * @param qualifications - The captain qualifications object
 * @returns True if the pilot is an examiner
 *
 * @example
 * ```typescript
 * if (isExaminer(pilot.captain_qualifications)) {
 *   console.log('Pilot can conduct check rides')
 * }
 * ```
 */
export function isExaminer(qualifications: CaptainQualifications | null | undefined): boolean {
  return qualifications?.examiner === true
}

/**
 * Checks if RHS (Right-Hand Seat) captain qualification is valid
 *
 * A qualification is considered valid if:
 * 1. An expiry date is set
 * 2. The expiry date is in the future
 *
 * @param qualifications - The captain qualifications object
 * @returns True if RHS captain qualification is currently valid
 *
 * @example
 * ```typescript
 * if (isRHSCaptainValid(pilot.captain_qualifications)) {
 *   console.log('RHS captain qualification is valid')
 * } else {
 *   console.log('RHS captain qualification has expired or is not set')
 * }
 * ```
 */
export function isRHSCaptainValid(
  qualifications: CaptainQualifications | null | undefined
): boolean {
  if (!qualifications?.rhs_captain_expiry) {
    return false
  }

  const expiryDate = parseISODateString(qualifications.rhs_captain_expiry)
  if (!expiryDate) {
    return false
  }

  return expiryDate > new Date()
}

/**
 * Calculates days until RHS captain qualification expires
 *
 * @param qualifications - The captain qualifications object
 * @returns Number of days until expiry, or null if no expiry date is set
 *
 * @example
 * ```typescript
 * const days = getDaysUntilRHSExpiry(pilot.captain_qualifications)
 * if (days !== null && days < 30) {
 *   console.warn('RHS captain qualification expires in', days, 'days')
 * }
 * ```
 */
export function getDaysUntilRHSExpiry(
  qualifications: CaptainQualifications | null | undefined
): number | null {
  if (!qualifications?.rhs_captain_expiry) {
    return null
  }

  const expiryDate = parseISODateString(qualifications.rhs_captain_expiry)
  if (!expiryDate) {
    return null
  }

  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Gets the RHS captain expiry date as a Date object
 *
 * @param qualifications - The captain qualifications object
 * @returns The expiry date or null if not set or invalid
 *
 * @example
 * ```typescript
 * const expiryDate = getRHSExpiryDate(pilot.captain_qualifications)
 * if (expiryDate) {
 *   console.log('Expires on:', expiryDate.toLocaleDateString())
 * }
 * ```
 */
export function getRHSExpiryDate(
  qualifications: CaptainQualifications | null | undefined
): Date | null {
  if (!qualifications?.rhs_captain_expiry) {
    return null
  }

  return parseISODateString(qualifications.rhs_captain_expiry)
}

/**
 * Creates a comprehensive qualification summary with computed properties
 *
 * This function provides a complete overview of a pilot's captain qualifications
 * with all relevant computed fields.
 *
 * @param qualifications - The captain qualifications object
 * @returns A complete qualification summary
 *
 * @example
 * ```typescript
 * const summary = getCaptainQualificationSummary(pilot.captain_qualifications)
 * console.log('Line Captain:', summary.isLineCaptain)
 * console.log('Days until RHS expiry:', summary.rhsCaptainDaysUntilExpiry)
 * ```
 */
export function getCaptainQualificationSummary(
  qualifications: CaptainQualifications | null | undefined
): CaptainQualificationSummary {
  return {
    isLineCaptain: isLineCaptain(qualifications),
    isTrainingCaptain: isTrainingCaptain(qualifications),
    isExaminer: isExaminer(qualifications),
    rhsCaptainExpiry: getRHSExpiryDate(qualifications),
    rhsCaptainIsValid: isRHSCaptainValid(qualifications),
    rhsCaptainDaysUntilExpiry: getDaysUntilRHSExpiry(qualifications),
  }
}

/**
 * Counts the number of special qualifications a pilot has
 *
 * This counts line captain, training captain, and examiner qualifications.
 * Does not include RHS captain as it's more of an expiry-based status.
 *
 * @param qualifications - The captain qualifications object
 * @returns The number of special qualifications (0-3)
 *
 * @example
 * ```typescript
 * const count = countSpecialQualifications(pilot.captain_qualifications)
 * console.log(`Pilot has ${count} special qualification(s)`)
 * ```
 */
export function countSpecialQualifications(
  qualifications: CaptainQualifications | null | undefined
): number {
  let count = 0

  if (isLineCaptain(qualifications)) count++
  if (isTrainingCaptain(qualifications)) count++
  if (isExaminer(qualifications)) count++

  return count
}

/**
 * Gets a human-readable list of qualification badges
 *
 * @param qualifications - The captain qualifications object
 * @returns An array of qualification badge strings
 *
 * @example
 * ```typescript
 * const badges = getQualificationBadges(pilot.captain_qualifications)
 * // Returns: ['Line Captain', 'Training Captain', 'Examiner', 'RHS Captain']
 * ```
 */
export function getQualificationBadges(
  qualifications: CaptainQualifications | null | undefined
): string[] {
  const badges: string[] = []

  if (isLineCaptain(qualifications)) {
    badges.push('Line Captain')
  }

  if (isTrainingCaptain(qualifications)) {
    badges.push('Training Captain')
  }

  if (isExaminer(qualifications)) {
    badges.push('Examiner')
  }

  if (isRHSCaptainValid(qualifications)) {
    badges.push('RHS Captain')
  }

  return badges
}

/**
 * Validates that required qualifications are present for a specific role
 *
 * @param qualifications - The captain qualifications object
 * @param requiredQualifications - Array of required qualification keys
 * @returns True if all required qualifications are present and true
 *
 * @example
 * ```typescript
 * // Check if pilot can conduct training
 * if (hasRequiredQualifications(qualifications, ['line_captain', 'training_captain'])) {
 *   console.log('Pilot can conduct training flights')
 * }
 * ```
 */
export function hasRequiredQualifications(
  qualifications: CaptainQualifications | null | undefined,
  requiredQualifications: Array<keyof CaptainQualifications>
): boolean {
  if (!qualifications) {
    return false
  }

  return requiredQualifications.every((key) => {
    if (key === 'rhs_captain_expiry') {
      return isRHSCaptainValid(qualifications)
    }
    return qualifications[key] === true
  })
}

/**
 * Checks if any qualifications are about to expire
 *
 * Currently only checks RHS captain expiry as it's the only date-based qualification.
 *
 * @param qualifications - The captain qualifications object
 * @param warningDays - Number of days before expiry to trigger warning (default: 30)
 * @returns True if any qualification expires within the warning period
 *
 * @example
 * ```typescript
 * if (hasExpiringQualifications(pilot.captain_qualifications, 60)) {
 *   console.warn('Pilot has qualifications expiring in the next 60 days')
 * }
 * ```
 */
export function hasExpiringQualifications(
  qualifications: CaptainQualifications | null | undefined,
  warningDays: number = 30
): boolean {
  const daysUntilExpiry = getDaysUntilRHSExpiry(qualifications)

  if (daysUntilExpiry === null) {
    return false
  }

  return daysUntilExpiry > 0 && daysUntilExpiry <= warningDays
}

/**
 * Formats qualification status as a color-coded status indicator
 *
 * @param qualifications - The captain qualifications object
 * @returns Color code: 'red' (expired), 'yellow' (expiring soon), 'green' (valid), 'gray' (not set)
 *
 * @example
 * ```typescript
 * const status = getQualificationStatusColor(pilot.captain_qualifications)
 * const className = `status-${status}` // 'status-green', 'status-yellow', etc.
 * ```
 */
export function getQualificationStatusColor(
  qualifications: CaptainQualifications | null | undefined
): 'red' | 'yellow' | 'green' | 'gray' {
  if (!qualifications?.rhs_captain_expiry) {
    return 'gray'
  }

  const daysUntilExpiry = getDaysUntilRHSExpiry(qualifications)

  if (daysUntilExpiry === null) {
    return 'gray'
  }

  if (daysUntilExpiry < 0) {
    return 'red' // Expired
  }

  if (daysUntilExpiry <= 30) {
    return 'yellow' // Expiring soon
  }

  return 'green' // Valid
}
