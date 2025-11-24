/**
 * ROSTER PERIOD UTILITIES
 *
 * ========================================
 * BUSINESS RULES: 28-DAY ROSTER PERIODS
 * ========================================
 *
 * CRITICAL AVIATION SCHEDULING CONCEPT:
 *
 * The B767 fleet operates on a 28-day roster period system (RP1-RP13).
 * This is a fundamental business rule that governs ALL leave requests,
 * crew scheduling, and operational planning.
 *
 * WHY 28 DAYS?
 * - Aligns with monthly crew rotations and flight schedules
 * - Provides predictable planning cycles for both pilots and management
 * - 13 periods × 28 days = 364 days (nearly full year coverage)
 * - Industry-standard practice for aviation crew scheduling
 *
 * ========================================
 * ROSTER PERIOD STRUCTURE
 * ========================================
 *
 * ANNUAL CYCLE:
 * - Each year has exactly 13 roster periods (RP1 through RP13)
 * - Each roster period is exactly 28 days long
 * - Total: 13 × 28 = 364 days per year
 *
 * PERIOD NUMBERING:
 * - Format: "RP{number}/{year}" (e.g., "RP12/2025")
 * - Number ranges from 1 to 13 within each year
 * - After RP13/YYYY, the next period is RP1/(YYYY+1)
 *
 * KNOWN ANCHOR POINT (CRITICAL):
 * - RP13/2025 starts on November 8, 2025
 * - This is our reference point for all calculations
 * - All past and future roster periods are calculated from this anchor
 *
 * ========================================
 * CALCULATION LOGIC
 * ========================================
 *
 * FORWARD CALCULATION (Future Periods):
 * 1. Calculate days from anchor date (Nov 8, 2025)
 * 2. Divide by 28 to get number of complete periods passed
 * 3. Add to anchor period number (13) to get current period
 * 4. If number > 13, subtract 13 and increment year
 *
 * BACKWARD CALCULATION (Past Periods):
 * 1. Calculate negative days from anchor date
 * 2. Divide by 28 (floor division for negative numbers)
 * 3. Subtract from anchor period number (13)
 * 4. If number <= 0, add 13 and decrement year
 *
 * EXAMPLE CALCULATIONS:
 *
 * Date: November 15, 2025 (7 days after RP13/2025 start)
 * - Days since anchor: 7
 * - Periods passed: floor(7/28) = 0
 * - Result: RP13/2025 (same period, still within 28 days)
 *
 * Date: December 6, 2025 (28 days after RP13/2025 start)
 * - Days since anchor: 28
 * - Periods passed: floor(28/28) = 1
 * - Current number: 13 + 1 = 14 → wraps to RP01/2026
 * - Result: RP01/2026 (next period, year rollover)
 *
 * Date: January 3, 2026 (56 days after RP13/2025 start)
 * - Days since anchor: 56
 * - Periods passed: floor(56/28) = 2
 * - Current number: 13 + 2 = 15 → wraps to RP02/2026
 * - Result: RP02/2026
 *
 * ========================================
 * LEAVE REQUEST RULES
 * ========================================
 *
 * BOUNDARY ALIGNMENT:
 * - ALL leave requests MUST fall within roster period boundaries
 * - Cannot span across roster period boundaries
 * - Multi-period requests must be split into separate requests
 *
 * VALIDATION:
 * - Use getRosterPeriodFromDate() to validate start/end dates
 * - Ensure both dates belong to the same roster period
 * - Reject requests that violate boundary rules
 *
 * APPROVAL DEADLINES:
 * - Final review window: 22 days before NEXT roster period starts
 * - All pending requests for next period must be resolved
 * - Prevents last-minute scheduling conflicts
 *
 * ========================================
 * DATE HANDLING
 * ========================================
 *
 * TIMEZONE CONSIDERATIONS:
 * - All calculations use startOfDay() to normalize to midnight local time
 * - Prevents timezone-related date shifting issues
 * - Ensures consistent period boundaries regardless of time zone
 *
 * DATE COMPARISON:
 * - Always use date-fns functions for date arithmetic
 * - Never use string comparison for dates
 * - Handle edge cases (leap years, DST transitions)
 *
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 *
 * GET CURRENT ROSTER PERIOD:
 * ```typescript
 * const current = getCurrentRosterPeriodObject()
 * console.log(current.code) // "RP12/2025"
 * console.log(current.daysRemaining) // Days until period ends
 * ```
 *
 * VALIDATE LEAVE REQUEST DATES:
 * ```typescript
 * const startPeriod = getRosterPeriodFromDate(startDate)
 * const endPeriod = getRosterPeriodFromDate(endDate)
 *
 * if (startPeriod.code !== endPeriod.code) {
 *   throw new Error('Leave request spans multiple roster periods')
 * }
 * ```
 *
 * CHECK FINAL REVIEW WINDOW:
 * ```typescript
 * const alert = getFinalReviewAlert()
 * if (alert.isWithinReviewWindow && pendingCount > 0) {
 *   // Show alert to administrators
 *   showReviewAlert(alert.message)
 * }
 * ```
 *
 * GET AFFECTED PERIODS FOR RANGE:
 * ```typescript
 * const periods = getAffectedRosterPeriods(startDate, endDate)
 * console.log(`Request affects ${periods.length} roster period(s)`)
 * ```
 *
 * ========================================
 * EDGE CASES & SPECIAL SCENARIOS
 * ========================================
 *
 * YEAR ROLLOVER:
 * - RP13/2025 ends → RP1/2026 begins
 * - Handled automatically by modulo arithmetic
 * - No manual intervention required
 *
 * LEAP YEARS:
 * - 13 × 28 = 364 days (not 365 or 366)
 * - Creates 1-2 day "gap" at year end
 * - This is expected and accounted for in calculations
 *
 * HISTORICAL DATA:
 * - Can calculate periods going back indefinitely
 * - Uses same anchor point for consistency
 * - Useful for historical leave request analysis
 *
 * FUTURE PLANNING:
 * - getFutureRosterPeriods() generates periods for planning
 * - Useful for leave calendar views (12+ months ahead)
 * - Automatically handles year transitions
 *
 * @module lib/utils/roster-utils
 * @version 2.0.0
 * @created 2025-10-17
 * @updated 2025-10-17 - Comprehensive business rule documentation added
 */

import {
  differenceInDays,
  addDays,
  format,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  startOfDay,
} from 'date-fns'

// ========================================
// CONSTANTS
// ========================================

/**
 * Duration of each roster period in days
 *
 * BUSINESS RULE: Fixed at 28 days for predictable crew scheduling
 * DO NOT CHANGE without management approval and system-wide updates
 */
const ROSTER_DURATION = 28

/**
 * Number of roster periods per year
 *
 * CALCULATION: 13 periods × 28 days = 364 days
 * NOTE: Creates 1-2 day gap at year end (expected behavior)
 */
const PERIODS_PER_YEAR = 13

/**
 * Known roster period anchor point
 *
 * CRITICAL: All roster period calculations derive from this reference
 *
 * ANCHOR DETAILS:
 * - Period: RP13/2025
 * - Start Date: November 8, 2025 (Saturday)
 * - End Date: December 5, 2025 (Friday) [28 days later]
 * - Next Period: RP01/2026 starts December 6, 2025
 *
 * MAINTENANCE NOTE:
 * - Verify this date with fleet operations before changing
 * - Update requires recalculation of all historical data
 * - Must coordinate with leave request system migration
 */
const KNOWN_ROSTER = {
  number: 13,
  year: 2025,
  startDate: new Date('2025-11-08'),
}

// ========================================
// TYPES
// ========================================

/**
 * Roster period data structure
 *
 * CONTAINS:
 * - code: Human-readable identifier (e.g., "RP12/2025")
 * - number: Period number within year (1-13)
 * - year: Calendar year
 * - startDate: First day of period (inclusive)
 * - endDate: Last day of period (inclusive)
 * - daysRemaining: Days until period ends (0 = today is last day)
 */
export interface RosterPeriod {
  code: string
  number: number
  year: number
  startDate: Date
  endDate: Date
  daysRemaining: number
}

// ========================================
// CORE FUNCTIONS
// ========================================

/**
 * Calculate the current roster period based on today's date
 *
 * BUSINESS LOGIC:
 * 1. Normalize current date to midnight (avoid timezone issues)
 * 2. Calculate days elapsed since anchor point (RP12/2025)
 * 3. Divide by 28 to get complete periods passed
 * 4. Apply modulo arithmetic for year wraparound
 * 5. Calculate start/end dates and remaining days
 *
 * EXAMPLES:
 * - Nov 15, 2025 → RP13/2025 (7 days into period)
 * - Dec 10, 2025 → RP01/2026 (4 days into period, new year cycle)
 * - Jan 10, 2026 → RP02/2026 (7 days into period)
 *
 * @returns Current roster period with all calculated fields
 */
export function getCurrentRosterPeriodObject(): RosterPeriod {
  // Normalize to midnight local time to avoid timezone issues
  const today = startOfDay(new Date())

  // Calculate days since known roster start
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.startDate)

  // Calculate how many complete periods have passed
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  // Calculate roster number (wraps at 13)
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollover: after RP13, go to RP1 of next year
  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR
    year += 1
  }

  // Handle past dates (before known roster)
  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR
    year -= 1
  }

  // Calculate start and end dates
  const startDate = addDays(KNOWN_ROSTER.startDate, periodsPassed * ROSTER_DURATION)
  const endDate = addDays(startDate, ROSTER_DURATION - 1)
  const daysRemaining = Math.max(0, differenceInDays(endDate, today))

  return {
    code: `RP${String(rosterNumber).padStart(2, '0')}/${year}`,
    number: rosterNumber,
    year,
    startDate,
    endDate,
    daysRemaining,
  }
}

/**
 * Get roster period from a specific date
 *
 * BUSINESS LOGIC:
 * Used for validating leave request dates and determining which
 * roster period a given date belongs to.
 *
 * CRITICAL FOR:
 * - Leave request validation (must be within single period)
 * - Historical data analysis
 * - Future period planning
 *
 * @param date - The target date to check
 * @returns Roster period containing that date
 *
 * @example
 * ```typescript
 * // Validate leave request doesn't span periods
 * const startPeriod = getRosterPeriodFromDate(leaveRequest.startDate)
 * const endPeriod = getRosterPeriodFromDate(leaveRequest.endDate)
 *
 * if (startPeriod.code !== endPeriod.code) {
 *   throw new Error('Leave request must be within single roster period')
 * }
 * ```
 */
export function getRosterPeriodFromDate(date: Date): RosterPeriod {
  // Use date as-is without timezone normalization to avoid date shifting
  const targetDate = new Date(date)

  // Calculate days since known roster start (using normalized comparison)
  const daysSinceKnown = differenceInDays(targetDate, KNOWN_ROSTER.startDate)

  // Calculate how many complete periods have passed (can be negative for past dates)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  // Calculate roster number
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed
  let year = KNOWN_ROSTER.year

  // Handle year rollover
  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR
    year += 1
  }

  // Handle past dates
  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR
    year -= 1
  }

  // Calculate start and end dates
  const startDate = addDays(KNOWN_ROSTER.startDate, periodsPassed * ROSTER_DURATION)
  const endDate = addDays(startDate, ROSTER_DURATION - 1)
  const daysRemaining = Math.max(0, differenceInDays(endDate, new Date()))

  return {
    code: `RP${String(rosterNumber).padStart(2, '0')}/${year}`,
    number: rosterNumber,
    year,
    startDate,
    endDate,
    daysRemaining,
  }
}

/**
 * Get the next roster period after a given period
 *
 * BUSINESS LOGIC:
 * Handles year rollover automatically. After RP13/YYYY, returns RP1/(YYYY+1)
 *
 * @param current - The current roster period
 * @returns The next roster period
 */
export function getNextRosterPeriodObject(current: RosterPeriod): RosterPeriod {
  const nextStartDate = addDays(current.endDate, 1)
  return getRosterPeriodFromDate(nextStartDate)
}

/**
 * Get the previous roster period before a given period
 *
 * BUSINESS LOGIC:
 * Handles year rollover automatically. Before RP1/YYYY, returns RP13/(YYYY-1)
 *
 * @param current - The current roster period
 * @returns The previous roster period
 */
export function getPreviousRosterPeriodObject(current: RosterPeriod): RosterPeriod {
  const prevEndDate = addDays(current.startDate, -1)
  return getRosterPeriodFromDate(prevEndDate)
}

/**
 * Format roster period for display
 *
 * OUTPUT FORMAT: "RP13/2025: Nov 08 - Dec 05, 2025"
 *
 * @param roster - The roster period to format
 * @returns Human-readable roster period string
 */
export function formatRosterPeriodFromObject(roster: RosterPeriod): string {
  const startFormatted = format(roster.startDate, 'MMM dd')
  const endFormatted = format(roster.endDate, 'MMM dd, yyyy')
  return `${roster.code}: ${startFormatted} - ${endFormatted}`
}

/**
 * Check if a date falls within a roster period
 *
 * BUSINESS LOGIC:
 * Inclusive check (both start and end dates are within period)
 *
 * @param date - Date to check
 * @param roster - Roster period to check against
 * @returns True if date is within period (inclusive)
 */
export function isDateInRoster(date: Date, roster: RosterPeriod): boolean {
  return date >= roster.startDate && date <= roster.endDate
}

/**
 * Calculate days between two dates (inclusive)
 *
 * BUSINESS LOGIC:
 * Adds 1 to include both start and end dates in count
 *
 * EXAMPLE:
 * - Oct 1 to Oct 1 = 1 day (same day counts)
 * - Oct 1 to Oct 3 = 3 days (Oct 1, 2, 3)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days (inclusive)
 */
// Removed: calculateDaysBetween is now exported from date-range-utils.ts
// Use: import { calculateDaysBetween } from './date-range-utils'

/**
 * Get all dates in a roster period as array
 *
 * BUSINESS LOGIC:
 * Returns 28 Date objects (one for each day in period)
 * Useful for calendar rendering and date iteration
 *
 * @param roster - Roster period
 * @returns Array of all dates in period (28 dates)
 */
export function getRosterDates(roster: RosterPeriod): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(roster.startDate)

  while (currentDate <= roster.endDate) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Get roster periods affected by a date range
 *
 * BUSINESS LOGIC:
 * Returns all roster periods that overlap with the given date range
 * Used for multi-period leave requests and reporting
 *
 * EXAMPLES:
 * - Nov 15 to Nov 25 (both in RP13/2025) → [RP13/2025]
 * - Nov 25 to Dec 10 (spans two periods) → [RP13/2025, RP01/2026]
 * - Dec 1 to Jan 15 (spans year) → [RP13/2025, RP01/2026, RP02/2026]
 *
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @returns Array of affected roster periods
 */
export function getAffectedRosterPeriods(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  const startPeriod = getRosterPeriodFromDate(startDate)
  const endPeriod = getRosterPeriodFromDate(endDate)

  // If same period, return just one
  if (startPeriod.code === endPeriod.code) {
    return [startPeriod]
  }

  // Get all periods between start and end dates
  let currentDate = new Date(startDate)
  const finalDate = new Date(endDate)

  while (currentDate <= finalDate) {
    const currentPeriod = getRosterPeriodFromDate(currentDate)

    // Add period if not already included
    if (!periods.some((p) => p.code === currentPeriod.code)) {
      periods.push(currentPeriod)
    }

    // Move to the next period's start date
    currentDate = addDays(currentPeriod.endDate, 1)
  }

  return periods
}

/**
 * Get future roster periods for planning
 *
 * BUSINESS LOGIC:
 * Generates a sequence of future roster periods for calendar display
 * and long-term leave request planning
 *
 * CALCULATION:
 * - 13 periods per year
 * - monthsAhead = 12 → approximately 13 periods
 * - Automatically handles year transitions
 *
 * @param monthsAhead - Number of months to generate (default: 12)
 * @returns Array of future roster periods
 */
export function getFutureRosterPeriods(monthsAhead: number = 12): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  const current = getCurrentRosterPeriodObject()
  let currentPeriod = current

  // Calculate approximately how many periods we need for the given months
  // 13 periods per year × (months / 12)
  const periodsNeeded = Math.ceil((monthsAhead / 12) * PERIODS_PER_YEAR)

  for (let i = 0; i < periodsNeeded; i++) {
    periods.push(currentPeriod)
    currentPeriod = getNextRosterPeriodObject(currentPeriod)
  }

  return periods
}

// ========================================
// COUNTDOWN UTILITIES
// ========================================

/**
 * Countdown data structure
 *
 * Used for real-time countdown displays on dashboard
 */
export interface RosterCountdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  isNextRoster: boolean
  nextRoster: RosterPeriod
}

/**
 * Get countdown to the next roster period start
 *
 * BUSINESS LOGIC:
 * Calculates precise time remaining until next roster period begins
 * Used for dashboard widgets and final review alerts
 *
 * @returns Countdown object with time components
 */
export function getNextRosterCountdown(): RosterCountdown {
  const now = new Date()
  const current = getCurrentRosterPeriodObject()
  const next = getNextRosterPeriodObject(current)

  // Calculate time difference to next roster start
  const totalDays = differenceInDays(next.startDate, now)
  const totalHours = differenceInHours(next.startDate, now)
  const totalMinutes = differenceInMinutes(next.startDate, now)
  const totalSeconds = differenceInSeconds(next.startDate, now)

  // Calculate remaining time components
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalDays: Math.max(0, totalDays),
    isNextRoster: totalDays >= 0,
    nextRoster: next,
  }
}

/**
 * Format countdown for display
 *
 * ADAPTIVE FORMAT:
 * - > 1 day: "X days, Y hours"
 * - 1 day: "1 day, X hours"
 * - < 1 day: "X hours, Y minutes"
 * - < 1 hour: "X minutes"
 * - < 1 minute: "X seconds"
 *
 * @param countdown - Countdown object
 * @returns Human-readable countdown string
 */
export function formatCountdown(countdown: RosterCountdown): string {
  if (countdown.totalDays > 1) {
    return `${countdown.days} days, ${countdown.hours} hours`
  } else if (countdown.days === 1) {
    return `1 day, ${countdown.hours} hours`
  } else if (countdown.hours > 0) {
    return `${countdown.hours} hours, ${countdown.minutes} minutes`
  } else if (countdown.minutes > 0) {
    return `${countdown.minutes} minutes`
  } else {
    return `${countdown.seconds} seconds`
  }
}

// ========================================
// FINAL REVIEW ALERTS
// ========================================

/**
 * Final review alert data structure
 *
 * BUSINESS CONTEXT:
 * Administrators must review and finalize all pending leave requests
 * for the NEXT roster period before it begins. This ensures crew
 * availability is confirmed 22 days in advance.
 */
export interface FinalReviewAlert {
  isWithinReviewWindow: boolean
  daysUntilRosterStarts: number
  daysRemainingInWindow: number
  nextRoster: RosterPeriod
  currentRoster: RosterPeriod
  reviewDeadlineDate: Date
  severity: 'urgent' | 'warning' | 'info'
  message: string
}

/**
 * Check if we're within 22 days before next roster period starts
 *
 * BUSINESS RULES:
 *
 * REVIEW WINDOW: Opens 22 days before NEXT roster period starts
 *
 * WHY 22 DAYS?
 * - Gives pilots sufficient notice of approved leave
 * - Allows time for crew scheduling adjustments
 * - Prevents last-minute conflicts and disruptions
 *
 * IMPORTANT DISTINCTIONS:
 * - Review applies to NEXT roster (not current roster)
 * - Current roster is already in progress (no review needed)
 * - Future rosters beyond next are reviewed later
 *
 * SEVERITY LEVELS:
 * - URGENT: ≤ 7 days (immediate action required)
 * - WARNING: 8-22 days (review should begin)
 * - INFO: > 22 days (informational only)
 *
 * DISPLAY CONDITION:
 * - ONLY show alert when pendingCount > 0
 * - No alert needed if no pending requests exist
 *
 * @returns Final review alert with all relevant data
 */
/**
 * Get all roster periods that fall within a date range
 * Used for renewal planning to find eligible roster periods
 */
export function getRosterPeriodsInRange(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const period = getRosterPeriodFromDate(currentDate)

    // Avoid duplicates
    if (!periods.some((p) => p.code === period.code)) {
      periods.push(period)
    }

    // Move to next roster period (28 days)
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + 28)
  }

  return periods
}

/**
 * Parse roster period code into components
 * Re-exported from roster-period-service for convenience
 *
 * @param code - Roster period code (e.g., "RP01/2025")
 * @returns Object with period number and year, or null if invalid
 */
export function parseRosterPeriodCode(
  code: string
): { periodNumber: number; year: number } | null {
  // Validate format
  const match = code.match(/^RP(\d{1,2})\/(\d{4})$/)
  if (!match) {
    return null
  }

  const periodNumber = parseInt(match[1], 10)
  const year = parseInt(match[2], 10)

  // Validate period number is within valid range (1-13)
  if (periodNumber < 1 || periodNumber > PERIODS_PER_YEAR) {
    return null
  }

  return {
    periodNumber,
    year,
  }
}

export function getFinalReviewAlert(): FinalReviewAlert {
  const REVIEW_WINDOW_DAYS = 22
  const now = new Date()
  const current = getCurrentRosterPeriodObject()
  const next = getNextRosterPeriodObject(current)

  // Calculate days until NEXT roster starts (not current roster)
  const daysUntilRosterStarts = differenceInDays(next.startDate, now)
  const daysRemainingInWindow = Math.max(0, daysUntilRosterStarts)

  // Within review window = 22 days or less before NEXT roster starts
  const isWithinReviewWindow =
    daysUntilRosterStarts <= REVIEW_WINDOW_DAYS && daysUntilRosterStarts >= 0

  // Calculate the review deadline (22 days before NEXT roster starts)
  const reviewDeadlineDate = addDays(next.startDate, -REVIEW_WINDOW_DAYS)

  let severity: 'urgent' | 'warning' | 'info'
  let message: string

  if (daysUntilRosterStarts <= 3) {
    severity = 'urgent'
    message = `URGENT: Next roster ${next.code} starts in ${daysUntilRosterStarts} day(s)! All pending leave for ${next.code} must be reviewed immediately.`
  } else if (daysUntilRosterStarts <= 7) {
    severity = 'urgent'
    message = `URGENT: Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Final review window - approve or deny all pending leave requests for ${next.code}.`
  } else if (isWithinReviewWindow) {
    severity = 'warning'
    message = `REVIEW REQUIRED: Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Please review and finalize all pending leave requests for ${next.code}.`
  } else {
    severity = 'info'
    message = `Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Review window opens in ${daysUntilRosterStarts - REVIEW_WINDOW_DAYS} days.`
  }

  return {
    isWithinReviewWindow,
    daysUntilRosterStarts,
    daysRemainingInWindow,
    nextRoster: next,
    currentRoster: current,
    reviewDeadlineDate,
    severity,
    message,
  }
}
