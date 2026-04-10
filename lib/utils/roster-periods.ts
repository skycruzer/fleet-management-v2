/**
 * Roster Period Utilities
 * Author: Maurice Rondeau
 * Date: November 16, 2025
 *
 * Shared utilities for roster period generation and date conversion
 */

/**
 * Generate roster periods for given years
 * Format: RP01/2025, RP02/2025, ..., RP13/2025 (zero-padded)
 *
 * @param years - Years to generate periods for (default: 2025, 2026)
 * @param options.currentAndFutureOnly - When true, excludes past periods (end date < today)
 */
export function generateRosterPeriods(
  years: number[] = [2025, 2026],
  options?: { currentAndFutureOnly?: boolean }
): string[] {
  const periods: string[] = []
  for (const year of years) {
    for (let rp = 1; rp <= 13; rp++) {
      periods.push(`RP${String(rp).padStart(2, '0')}/${year}`)
    }
  }

  if (!options?.currentAndFutureOnly) return periods

  const today = new Date().toISOString().split('T')[0]
  return periods.filter((period) => {
    const range = rosterPeriodToDateRange(period)
    return range ? range.endDate >= today : false
  })
}

/**
 * Parse roster period string to period number and year
 * Example: "RP12/2025" → { period: 12, year: 2025 }
 */
export function parseRosterPeriod(rosterPeriod: string): { period: number; year: number } | null {
  const match = rosterPeriod.match(/^RP(\d+)\/(\d{4})$/)
  if (!match) return null

  return {
    period: parseInt(match[1], 10),
    year: parseInt(match[2], 10),
  }
}

/**
 * Convert roster period to date range
 * Uses the known anchor: RP12/2025 starts 2025-10-11
 */
export function rosterPeriodToDateRange(rosterPeriod: string): {
  startDate: string
  endDate: string
} | null {
  const parsed = parseRosterPeriod(rosterPeriod)
  if (!parsed) return null

  const { period, year } = parsed

  // Known anchor: RP12/2025 starts on 2025-10-11
  const anchorDate = new Date('2025-10-11')
  const anchorPeriod = 12
  const anchorYear = 2025

  // Calculate total periods difference from anchor
  const yearDiff = year - anchorYear
  const periodDiff = period - anchorPeriod
  const totalPeriodsDiff = yearDiff * 13 + periodDiff

  // Each roster period is 28 days
  const daysDiff = totalPeriodsDiff * 28

  // Calculate start date
  const startDate = new Date(anchorDate)
  startDate.setDate(startDate.getDate() + daysDiff)

  // End date is 27 days after start (28-day period inclusive)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 27)

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

/**
 * Convert multiple roster periods to combined date range
 * Returns earliest start date and latest end date
 */
export function rosterPeriodsToDateRange(rosterPeriods: string[]): {
  startDate: string
  endDate: string
} | null {
  if (rosterPeriods.length === 0) return null

  const ranges = rosterPeriods
    .map(rosterPeriodToDateRange)
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (ranges.length === 0) return null

  const startDates = ranges.map((r) => r.startDate)
  const endDates = ranges.map((r) => r.endDate)

  return {
    startDate: startDates.sort()[0],
    endDate: endDates.sort().reverse()[0],
  }
}
