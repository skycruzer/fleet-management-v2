/**
 * Date Formatting Utilities
 * Author: Maurice Rondeau
 * Date: November 17, 2025
 *
 * Australian date format utilities (DD/MM/YYYY)
 */

/**
 * Format date to Australian format: DD/MM/YYYY
 * @param date - Date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatAustralianDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    return dateObj.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
