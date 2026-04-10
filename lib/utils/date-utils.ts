/**
 * Date Formatting Utilities
 * Standardized date formatting functions for the Fleet Management application
 *
 * Australian Date Format Standards:
 * - Default format: DD MMM YYYY (e.g., "24 Oct 2025")
 * - Uses en-AU locale for proper Australian formatting
 * - Month abbreviations: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
 */

/**
 * Format options for consistent date display across the app
 * All formats use Australian conventions (day-first)
 */
const DATE_FORMATS = {
  /** Long format: 15 January 2025 */
  LONG: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  /** Medium format (Default): 15 Jan 2025 - Australian short date format */
  MEDIUM: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  /** Short format: 15/01/2025 - Australian numeric format */
  SHORT: {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
  },
  /** ISO format: 2025-01-15 - Database/API format only */
  ISO: {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
  },
  /** Month/Year only: Jan 2025 */
  MONTH_YEAR: {
    year: 'numeric' as const,
    month: 'short' as const,
  },
} as const

/**
 * Default locale for date formatting
 * Using en-AU (Australian English) for proper DD MMM YYYY format
 */
const DEFAULT_LOCALE = 'en-AU'

/**
 * Check if date is valid
 * @param date - Date to validate
 * @returns True if valid date
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false

  const d = typeof date === 'string' ? new Date(date) : date
  return !isNaN(d.getTime())
}

/**
 * Convert input to Date object
 * @param date - Date input
 * @returns Date object or null
 */
export function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null

  const d = typeof date === 'string' ? new Date(date) : date
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format date in long format (e.g., "15 January 2025")
 * Australian format: DD MMMM YYYY
 * @param date - Date to format
 * @returns Formatted date string or empty string
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMATS.LONG)
}

/**
 * Format date in medium format (e.g., "15 Jan 2025")
 * Australian short date format: DD MMM YYYY
 * This is the standard format for most of the app
 * @param date - Date to format
 * @returns Formatted date string or empty string
 */
export function formatDate(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMATS.MEDIUM)
}

/**
 * Format date in short numeric format (e.g., "15/01/2025")
 * Australian numeric format: DD/MM/YYYY
 * @param date - Date to format
 * @returns Formatted date string or empty string
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMATS.SHORT)
}

/**
 * Format date in ISO format (e.g., "2025-01-15")
 * Useful for APIs and database operations
 * @param date - Date to format
 * @returns ISO date string (YYYY-MM-DD) or empty string
 */
export function formatDateISO(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toISOString().split('T')[0]
}

/**
 * Format month and year only (e.g., "Jan 2025")
 * @param date - Date to format
 * @returns Formatted string or empty string
 */
export function formatMonthYear(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleDateString(DEFAULT_LOCALE, DATE_FORMATS.MONTH_YEAR)
}

/**
 * Format time (e.g., "2:30 PM")
 * @param date - Date to format
 * @returns Formatted time string or empty string
 */
export function formatTime(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format date and time (e.g., "Jan 15, 2025, 2:30 PM")
 * @param date - Date to format
 * @returns Formatted date-time string or empty string
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  return d.toLocaleString(DEFAULT_LOCALE, {
    ...DATE_FORMATS.MEDIUM,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format date relative to now (e.g., "2 days ago", "in 3 days")
 * @param date - Date to format
 * @returns Relative time string or absolute date
 */
export function formatDateRelative(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return ''

  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  // For dates far in the past or future, show absolute date
  if (Math.abs(diffDays) > 30) {
    return formatDate(d)
  }

  // Today
  if (diffDays === 0) return 'Today'

  // Yesterday/Tomorrow
  if (diffDays === -1) return 'Yesterday'
  if (diffDays === 1) return 'Tomorrow'

  // Recent past
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`
  }

  // Near future
  return `in ${diffDays} days`
}

/**
 * Calculate days until a date
 * @param date - Future date
 * @returns Number of days (negative if in past), or null
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  const d = toDate(date)
  if (!d) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset to start of day

  const target = new Date(d)
  target.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date | string | null | undefined): boolean {
  const days = daysUntil(date)
  return days !== null && days < 0
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date | string | null | undefined): boolean {
  const days = daysUntil(date)
  return days !== null && days > 0
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  const days = daysUntil(date)
  return days === 0
}

/**
 * Format date range (e.g., "15 Jan - 20 Jan 2025" or "15 Jan 2025 - 20 Feb 2026")
 * Australian format: DD MMM - DD MMM YYYY
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string {
  const start = toDate(startDate)
  const end = toDate(endDate)

  if (!start && !end) return ''
  if (!start) return formatDate(end)
  if (!end) return formatDate(start)

  // Same year
  if (start.getFullYear() === end.getFullYear()) {
    // Same month
    if (start.getMonth() === end.getMonth()) {
      const startDay = start.getDate()
      const endDay = end.getDate()
      const month = start.toLocaleDateString(DEFAULT_LOCALE, { month: 'short' })
      const year = start.getFullYear()

      // Australian format: 15 - 20 Jan 2025
      return `${startDay} - ${endDay} ${month} ${year}`
    }

    // Different month, same year
    const startMonth = start.toLocaleDateString(DEFAULT_LOCALE, { month: 'short' })
    const endMonth = end.toLocaleDateString(DEFAULT_LOCALE, { month: 'short' })
    const year = start.getFullYear()

    // Australian format: 15 Jan - 20 Feb 2025
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`
  }

  // Different year - Australian format: 15 Jan 2025 - 20 Feb 2026
  return `${formatDate(start)} - ${formatDate(end)}`
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years, or null
 */
export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  const dob = toDate(dateOfBirth)
  if (!dob) return null

  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  return age
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string for input[type="date"]
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  return formatDateISO(date)
}

/**
 * Parse date from input field
 * @param value - Input value (YYYY-MM-DD)
 * @returns Date object or null
 */
export function parseDateFromInput(value: string): Date | null {
  if (!value) return null

  const date = new Date(value + 'T00:00:00')
  return isNaN(date.getTime()) ? null : date
}

/**
 * Get start of day
 * @param date - Date
 * @returns Date at 00:00:00
 */
export function startOfDay(date: Date | string): Date {
  const d = toDate(date) || new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 * @param date - Date
 * @returns Date at 23:59:59
 */
export function endOfDay(date: Date | string): Date {
  const d = toDate(date) || new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Add days to a date
 * @param date - Date
 * @param days - Number of days to add (negative to subtract)
 * @returns New date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = toDate(date) || new Date()
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Format date with certification status color coding
 * Useful for displaying expiry dates with visual indicators
 * @param date - Expiry date
 * @returns Object with formatted date and color
 */
export function formatExpiryDate(date: Date | string | null | undefined): {
  formatted: string
  daysUntil: number | null
  color: 'red' | 'yellow' | 'green' | 'gray'
  label: string
} {
  const d = toDate(date)

  if (!d) {
    return {
      formatted: 'No date',
      daysUntil: null,
      color: 'gray',
      label: 'No Date',
    }
  }

  const days = daysUntil(d)
  const formatted = formatDate(d)

  if (days === null) {
    return { formatted, daysUntil: null, color: 'gray', label: 'Unknown' }
  }

  if (days < 0) {
    return {
      formatted,
      daysUntil: days,
      color: 'red',
      label: 'Expired',
    }
  }

  if (days <= 30) {
    return {
      formatted,
      daysUntil: days,
      color: 'yellow',
      label: 'Expiring Soon',
    }
  }

  return {
    formatted,
    daysUntil: days,
    color: 'green',
    label: 'Current',
  }
}
