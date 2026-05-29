/**
 * Retirement Calculation Utilities
 * Calculate years, months, and days until retirement
 * Retirement age is configured in system settings (default: 65 years)
 */

// Default retirement age (fallback if settings not available).
// Exported so retirement-forecast-service, succession-planning-service, and
// reports-service stop hardcoding their own copy of 65 — single source of truth.
export const DEFAULT_RETIREMENT_AGE = 65

/**
 * Completed full years between two dates using calendar arithmetic.
 * Math.floor(ms / 365.25 days) returned 14 for a pilot 14.99 years in service,
 * missing the `>= 15` "Ready" threshold a calendar day too early.
 *
 * Returns a non-negative integer (caps at 0 for future-dated `from`).
 */
export function yearsBetween(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear()
  if (
    to.getMonth() < from.getMonth() ||
    (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())
  ) {
    years--
  }
  return Math.max(0, years)
}

/**
 * Parse a date input as LOCAL time, not UTC.
 *
 * `new Date('1980-02-29')` is treated by the spec as UTC midnight; in any
 * timezone west of UTC that becomes 1980-02-28 local — which silently loses
 * the leap day before any downstream clamp can run. For YYYY-MM-DD strings
 * we therefore construct the Date via the local-time constructor instead.
 *
 * Exported so retirement-forecast-service, succession-planning-service, and
 * pilot-info reports can use the same parsing instead of repeating the bug.
 */
export function parseLocalDate(input: string | Date): Date {
  if (input instanceof Date) return input
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (match) {
    const [, y, m, d] = match
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  return new Date(input)
}

export interface RetirementCountdown {
  years: number
  months: number
  days: number
  totalDays: number
  retirementDate: Date
  isRetired: boolean
}

/**
 * Calculate retirement countdown from date of birth
 * @param dateOfBirth - Pilot's date of birth (ISO string or Date)
 * @param retirementAge - Retirement age from system settings (default: 65)
 * @returns Retirement countdown object
 */
export function calculateRetirementCountdown(
  dateOfBirth: string | Date | null,
  retirementAge: number = DEFAULT_RETIREMENT_AGE
): RetirementCountdown | null {
  if (!dateOfBirth) return null

  const birth = parseLocalDate(dateOfBirth)
  const today = new Date()

  // Calculate retirement date using provided or default retirement age
  const retirementDate = new Date(birth)
  retirementDate.setFullYear(birth.getFullYear() + retirementAge)
  // A Feb-29 birth date overflows to Mar 1 in a non-leap target year;
  // clamp it back to the last valid day of the intended month (Feb 28).
  if (retirementDate.getMonth() !== birth.getMonth()) {
    retirementDate.setDate(0)
  }

  // Check if already retired
  if (today >= retirementDate) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      retirementDate,
      isRetired: true,
    }
  }

  // Calculate time remaining
  let years = retirementDate.getFullYear() - today.getFullYear()
  let months = retirementDate.getMonth() - today.getMonth()
  let days = retirementDate.getDate() - today.getDate()

  // Adjust for negative days: borrow from the month preceding the RETIREMENT
  // date (not today's previous month). Otherwise countdowns are off-by-one
  // whenever today's previous month and retirement's previous month differ in
  // length (e.g. today=Feb 20, retirement=May 5: borrowing Jan's 31 vs Apr's 30
  // changes the answer by one day).
  if (days < 0) {
    months--
    const monthBeforeRetirement = new Date(
      retirementDate.getFullYear(),
      retirementDate.getMonth(),
      0
    )
    days += monthBeforeRetirement.getDate()
  }

  // Adjust for negative months
  if (months < 0) {
    years--
    months += 12
  }

  // Calculate total days for progress bars, etc.
  const totalDays = Math.floor((retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return {
    years,
    months,
    days,
    totalDays,
    retirementDate,
    isRetired: false,
  }
}

/**
 * Format retirement countdown as a human-readable string
 * @param countdown - Retirement countdown object
 * @returns Formatted string (e.g., "5 years, 3 months, 12 days")
 */
export function formatRetirementCountdown(countdown: RetirementCountdown | null): string {
  if (!countdown) return 'N/A'
  if (countdown.isRetired) return 'Retired'

  const parts: string[] = []

  if (countdown.years > 0) {
    parts.push(`${countdown.years} ${countdown.years === 1 ? 'year' : 'years'}`)
  }
  if (countdown.months > 0) {
    parts.push(`${countdown.months} ${countdown.months === 1 ? 'month' : 'months'}`)
  }
  if (countdown.days > 0) {
    parts.push(`${countdown.days} ${countdown.days === 1 ? 'day' : 'days'}`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Less than a day'
}

/**
 * Format retirement date as a readable string
 * @param retirementDate - Date object
 * @returns Formatted date string
 */
export function formatRetirementDate(retirementDate: Date): string {
  return retirementDate.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get a status indicator for retirement timeline
 * @param countdown - Retirement countdown object
 * @returns Status object with color and label
 */
export function getRetirementStatus(countdown: RetirementCountdown | null): {
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray'
  label: string
} {
  if (!countdown) return { color: 'gray', label: 'Unknown' }
  if (countdown.isRetired) return { color: 'gray', label: 'Retired' }

  const yearsRemaining = countdown.years

  if (yearsRemaining > 10) {
    return { color: 'green', label: 'Many years remaining' }
  } else if (yearsRemaining > 5) {
    return { color: 'yellow', label: 'Moderate timeline' }
  } else if (yearsRemaining > 2) {
    return { color: 'orange', label: 'Approaching retirement' }
  } else {
    return { color: 'red', label: 'Near retirement' }
  }
}
