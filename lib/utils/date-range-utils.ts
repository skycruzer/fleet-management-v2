/**
 * Date Range Utilities
 * Shared utilities for date range calculations and validation
 * Eliminates duplication of date math across forms
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

/**
 * Calculate the number of days between two dates (inclusive)
 * @param startDate - Start date (string or Date)
 * @param endDate - End date (string or Date)
 * @returns Number of days (inclusive), or 0 if invalid
 */
export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  if (!startDate || !endDate) return 0

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays + 1 // Inclusive of both start and end dates
}

/**
 * Validate that end date is on or after start date
 * @param startDate - Start date (string or Date)
 * @param endDate - End date (string or Date)
 * @returns true if valid, false otherwise
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  if (!startDate || !endDate) return false

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false

  return end >= start
}

/**
 * Check if a request is a late request (less than required notice days)
 * @param startDate - Start date of the request
 * @param requestDate - Date the request was submitted
 * @param requiredNoticeDays - Number of days notice required (default: 21)
 * @returns true if late, false otherwise
 */
export function isLateRequest(
  startDate: string | Date,
  requestDate: string | Date,
  requiredNoticeDays: number = 21
): boolean {
  if (!startDate || !requestDate) return false

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const request = typeof requestDate === 'string' ? new Date(requestDate) : requestDate

  if (isNaN(start.getTime()) || isNaN(request.getTime())) return false

  const diffTime = start.getTime() - request.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays < requiredNoticeDays
}

/**
 * Calculate days remaining until a date
 * @param targetDate - Target date to calculate days until
 * @param fromDate - Starting date (defaults to today)
 * @returns Number of days remaining (can be negative if in past)
 */
export function calculateDaysRemaining(
  targetDate: string | Date,
  fromDate: string | Date = new Date()
): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate

  if (isNaN(target.getTime()) || isNaN(from.getTime())) return 0

  const diffTime = target.getTime() - from.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format date to YYYY-MM-DD string (for input[type="date"])
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Parse date from YYYY-MM-DD string
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDateFromInput(dateString: string): Date | null {
  if (!dateString) return null

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  return date
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @param referenceDate - Reference date (defaults to today)
 * @returns true if date is in the future
 */
export function isFutureDate(date: string | Date, referenceDate: Date = new Date()): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return false

  // Set reference time to start of day for accurate comparison
  const refStart = new Date(referenceDate)
  refStart.setHours(0, 0, 0, 0)

  const checkDate = new Date(d)
  checkDate.setHours(0, 0, 0, 0)

  return checkDate > refStart
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @param referenceDate - Reference date (defaults to today)
 * @returns true if date is in the past
 */
export function isPastDate(date: string | Date, referenceDate: Date = new Date()): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return false

  // Set reference time to start of day for accurate comparison
  const refStart = new Date(referenceDate)
  refStart.setHours(0, 0, 0, 0)

  const checkDate = new Date(d)
  checkDate.setHours(0, 0, 0, 0)

  return checkDate < refStart
}

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Get today's date at start of day (00:00:00)
 * @returns Today's date with time set to 00:00:00
 */
export function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
