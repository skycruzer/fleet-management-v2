/**
 * Retirement Calculation Utilities
 * Calculate years, months, and days until retirement
 * Retirement age is configured in system settings (default: 65 years)
 */

// Default retirement age (fallback if settings not available)
const DEFAULT_RETIREMENT_AGE = 65

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

  const birth = new Date(dateOfBirth)
  const today = new Date()

  // Calculate retirement date using provided or default retirement age
  const retirementDate = new Date(birth)
  retirementDate.setFullYear(birth.getFullYear() + retirementAge)

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

  // Adjust for negative days
  if (days < 0) {
    months--
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += previousMonth.getDate()
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
  return retirementDate.toLocaleDateString('en-US', {
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
