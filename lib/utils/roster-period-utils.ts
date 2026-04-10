/**
 * Roster Period Utilities
 * Shared utilities for roster period calculations
 * Eliminates duplication of roster period logic across forms
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

/**
 * Known anchor point: RP12/2025 starts 2025-10-11
 * All roster period calculations are based on this anchor
 */
const ROSTER_PERIOD_ANCHOR = {
  date: new Date('2025-10-11'),
  rosterPeriod: 12,
  year: 2025,
} as const

/** Number of days in each roster period (28-day cycles) */
const ROSTER_PERIOD_DAYS = 28

/** Number of roster periods in a year */
const ROSTER_PERIODS_PER_YEAR = 13

/**
 * Calculate the current roster period based on today's date
 * @returns Roster period string in format "RPXX/YYYY"
 */
export function getCurrentRosterPeriod(): string {
  return getRosterPeriodForDate(new Date())
}

/**
 * Calculate the roster period for a specific date
 * @param date - Date to calculate roster period for
 * @returns Roster period string in format "RPXX/YYYY"
 */
export function getRosterPeriodForDate(date: Date): string {
  const { date: anchor, rosterPeriod: anchorRP, year: anchorYear } = ROSTER_PERIOD_ANCHOR

  // Calculate days since anchor
  const daysSinceAnchor = Math.floor((date.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate roster period offset (each period is 28 days)
  const rosterPeriodOffset = Math.floor(daysSinceAnchor / ROSTER_PERIOD_DAYS)

  let currentRP = anchorRP + rosterPeriodOffset
  let currentYear = anchorYear

  // Handle year rollover (RP13 → RP1 of next year)
  while (currentRP > ROSTER_PERIODS_PER_YEAR) {
    currentRP -= ROSTER_PERIODS_PER_YEAR
    currentYear++
  }
  while (currentRP < 1) {
    currentRP += ROSTER_PERIODS_PER_YEAR
    currentYear--
  }

  return formatRosterPeriod(currentRP, currentYear)
}

/**
 * Format roster period number and year into standard string
 * @param periodNumber - Roster period number (1-13)
 * @param year - Year (e.g., 2025)
 * @returns Formatted roster period string "RPXX/YYYY"
 */
export function formatRosterPeriod(periodNumber: number, year: number): string {
  return `RP${periodNumber.toString().padStart(2, '0')}/${year}`
}

/**
 * Parse roster period string into components
 * @param rosterPeriod - Roster period string "RPXX/YYYY"
 * @returns Object with periodNumber and year, or null if invalid
 */
export function parseRosterPeriod(
  rosterPeriod: string
): { periodNumber: number; year: number } | null {
  const match = rosterPeriod.match(/^RP(\d{1,2})\/(\d{4})$/)
  if (!match) return null

  const periodNumber = parseInt(match[1], 10)
  const year = parseInt(match[2], 10)

  if (periodNumber < 1 || periodNumber > ROSTER_PERIODS_PER_YEAR) return null
  if (year < 2000 || year > 2100) return null

  return { periodNumber, year }
}

/**
 * Validate roster period string format
 * @param rosterPeriod - Roster period string to validate
 * @returns true if valid format, false otherwise
 */
export function isValidRosterPeriod(rosterPeriod: string): boolean {
  return parseRosterPeriod(rosterPeriod) !== null
}

/**
 * Get the start date of a roster period
 * @param rosterPeriod - Roster period string "RPXX/YYYY"
 * @returns Start date of the roster period, or null if invalid
 */
export function getRosterPeriodStartDate(rosterPeriod: string): Date | null {
  const parsed = parseRosterPeriod(rosterPeriod)
  if (!parsed) return null

  const { periodNumber, year } = parsed
  const { date: anchor, rosterPeriod: anchorRP, year: anchorYear } = ROSTER_PERIOD_ANCHOR

  // Calculate total roster periods from anchor
  const yearDiff = year - anchorYear
  const totalPeriodsFromAnchor = yearDiff * ROSTER_PERIODS_PER_YEAR + (periodNumber - anchorRP)

  // Calculate days from anchor
  const daysFromAnchor = totalPeriodsFromAnchor * ROSTER_PERIOD_DAYS

  const startDate = new Date(anchor)
  startDate.setDate(startDate.getDate() + daysFromAnchor)

  return startDate
}

/**
 * Get the end date of a roster period
 * @param rosterPeriod - Roster period string "RPXX/YYYY"
 * @returns End date of the roster period (last day), or null if invalid
 */
export function getRosterPeriodEndDate(rosterPeriod: string): Date | null {
  const startDate = getRosterPeriodStartDate(rosterPeriod)
  if (!startDate) return null

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + ROSTER_PERIOD_DAYS - 1)

  return endDate
}

/**
 * Get the next roster period
 * @param rosterPeriod - Current roster period string "RPXX/YYYY"
 * @returns Next roster period string, or null if invalid
 */
export function getNextRosterPeriod(rosterPeriod: string): string | null {
  const parsed = parseRosterPeriod(rosterPeriod)
  if (!parsed) return null

  let { periodNumber, year } = parsed
  periodNumber++

  if (periodNumber > ROSTER_PERIODS_PER_YEAR) {
    periodNumber = 1
    year++
  }

  return formatRosterPeriod(periodNumber, year)
}

/**
 * Get the previous roster period
 * @param rosterPeriod - Current roster period string "RPXX/YYYY"
 * @returns Previous roster period string, or null if invalid
 */
export function getPreviousRosterPeriod(rosterPeriod: string): string | null {
  const parsed = parseRosterPeriod(rosterPeriod)
  if (!parsed) return null

  let { periodNumber, year } = parsed
  periodNumber--

  if (periodNumber < 1) {
    periodNumber = ROSTER_PERIODS_PER_YEAR
    year--
  }

  return formatRosterPeriod(periodNumber, year)
}

/**
 * Calculate days between two roster periods
 * @param startRP - Start roster period "RPXX/YYYY"
 * @param endRP - End roster period "RPXX/YYYY"
 * @returns Number of days, or null if invalid
 */
export function getDaysBetweenRosterPeriods(startRP: string, endRP: string): number | null {
  const startDate = getRosterPeriodStartDate(startRP)
  const endDate = getRosterPeriodEndDate(endRP)

  if (!startDate || !endDate) return null

  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
