/**
 * Date Formatting Utilities
 * Author: Maurice Rondeau
 * Date: November 17, 2025
 *
 * Australian date format utilities (DD/MM/YYYY) rendered in PNG local time
 * (UTC+10, no DST). On Vercel the server runs in UTC, so without an explicit
 * timeZone option dates rolled over wrong by up to 10 hours.
 */

const PNG_TIME_ZONE = 'Pacific/Port_Moresby'

/**
 * For date-only strings (YYYY-MM-DD), skip the Date → toLocale roundtrip entirely.
 * The string is already in the user's intended calendar day; reformatting through
 * a Date object risks TZ shift no matter which timezone we pin.
 */
function formatDateOnlyString(input: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!match) return null
  const [, y, m, d] = match
  return `${d}/${m}/${y}`
}

/**
 * Format date to Australian format: DD/MM/YYYY
 * @param date - Date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatAustralianDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'

  try {
    if (typeof date === 'string') {
      const dateOnly = formatDateOnlyString(date)
      if (dateOnly) return dateOnly
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    return dateObj.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: PNG_TIME_ZONE,
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Format date with time to Australian format: DD/MM/YYYY HH:MM
 * @param date - Date string or Date object
 * @returns Formatted datetime string
 */
export function formatAustralianDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    return dateObj.toLocaleString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: PNG_TIME_ZONE,
    })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return 'Invalid Date'
  }
}

/**
 * Format date range to Australian format: DD/MM/YYYY - DD/MM/YYYY
 * @param startDate - Start date string or Date object
 * @param endDate - End date string or Date object
 * @returns Formatted date range string
 */
export function formatAustralianDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string {
  const start = formatAustralianDate(startDate)
  const end = formatAustralianDate(endDate)

  if (start === 'N/A' || end === 'N/A') {
    return start === 'N/A' && end === 'N/A' ? 'N/A' : `${start} - ${end}`
  }

  return `${start} - ${end}`
}
