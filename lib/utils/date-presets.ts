/**
 * Date Presets Utilities
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.4: Date preset helper functions for report filters
 * Provides quick date range selections like "This Month", "Last Quarter", etc.
 */

export interface DateRange {
  startDate: string // ISO format: YYYY-MM-DD
  endDate: string // ISO format: YYYY-MM-DD
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get start and end of current month
 */
export function getThisMonth(): DateRange {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get start and end of last month
 */
export function getLastMonth(): DateRange {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get start and end of current quarter
 */
export function getThisQuarter(): DateRange {
  const now = new Date()
  const currentMonth = now.getMonth()
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3
  const startDate = new Date(now.getFullYear(), quarterStartMonth, 1)
  const endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get start and end of last quarter
 */
export function getLastQuarter(): DateRange {
  const now = new Date()
  const currentMonth = now.getMonth()
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3
  const lastQuarterStartMonth = quarterStartMonth - 3
  const startDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1)
  const endDate = new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get start and end of current year
 */
export function getThisYear(): DateRange {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), 0, 1)
  const endDate = new Date(now.getFullYear(), 11, 31)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get start and end of last year
 */
export function getLastYear(): DateRange {
  const now = new Date()
  const lastYear = now.getFullYear() - 1
  const startDate = new Date(lastYear, 0, 1)
  const endDate = new Date(lastYear, 11, 31)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get last N days
 */
export function getLastNDays(days: number): DateRange {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Get next N days
 */
export function getNextNDays(days: number): DateRange {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

/**
 * Available date presets
 */
export const DATE_PRESETS = {
  thisMonth: { label: 'This Month', fn: getThisMonth },
  lastMonth: { label: 'Last Month', fn: getLastMonth },
  thisQuarter: { label: 'This Quarter', fn: getThisQuarter },
  lastQuarter: { label: 'Last Quarter', fn: getLastQuarter },
  thisYear: { label: 'This Year', fn: getThisYear },
  lastYear: { label: 'Last Year', fn: getLastYear },
  last30Days: { label: 'Last 30 Days', fn: () => getLastNDays(30) },
  last90Days: { label: 'Last 90 Days', fn: () => getLastNDays(90) },
  next30Days: { label: 'Next 30 Days', fn: () => getNextNDays(30) },
  next90Days: { label: 'Next 90 Days', fn: () => getNextNDays(90) },
} as const

export type DatePresetKey = keyof typeof DATE_PRESETS
