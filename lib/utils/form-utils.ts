/**
 * Form Utility Functions
 * Common utilities for form data processing and transformation
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

/**
 * Normalize empty strings to null for database storage
 * Handles string trimming and empty string conversion
 */
export function normalizeToNull(value: any): string | null {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Convert date input to ISO string or null
 * Handles empty strings and invalid dates gracefully
 */
export function dateToISO(value: any): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date.toISOString()
  } catch {
    return null
  }
}

/**
 * Format ISO date string for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | null): string {
  if (!dateString) return ''

  try {
    return new Date(dateString).toISOString().split('T')[0]
  } catch {
    return ''
  }
}

/**
 * Process form data for pilot updates
 * Normalizes strings and converts dates to ISO format
 */
export function processPilotFormData(data: any): any {
  return {
    ...data,
    // Normalize optional string fields
    middle_name: normalizeToNull(data.middle_name),
    contract_type: normalizeToNull(data.contract_type),
    nationality: normalizeToNull(data.nationality),
    passport_number: normalizeToNull(data.passport_number),
    // Convert dates to ISO format
    passport_expiry: dateToISO(data.passport_expiry),
    date_of_birth: dateToISO(data.date_of_birth),
    commencement_date: dateToISO(data.commencement_date),
    // Boolean conversion handled by form
    is_active: data.is_active === 'true',
  }
}
