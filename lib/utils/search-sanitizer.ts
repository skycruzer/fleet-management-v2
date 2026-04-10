/**
 * Search Input Sanitization Utilities
 *
 * Prevents SQL injection and query manipulation in PostgREST search queries
 */

/**
 * Sanitizes search terms for use in PostgREST .ilike() queries
 *
 * Removes or escapes special characters that could interfere with queries:
 * - Escapes wildcards: % _ \
 * - Removes quotes and semicolons
 * - Trims whitespace
 *
 * @param searchTerm - Raw user input
 * @returns Sanitized search term safe for .ilike() queries
 *
 * @example
 * ```typescript
 * const userInput = "O'Malley; DROP TABLE--"
 * const safe = sanitizeSearchTerm(userInput)
 * // safe = "OMalley DROP TABLE"
 *
 * query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`)
 * ```
 */
export function sanitizeSearchTerm(searchTerm: string): string {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return ''
  }

  return searchTerm
    .replace(/[%_\\]/g, '\\$&') // Escape PostgREST wildcards
    .replace(/['"`;,()]/g, '') // Remove dangerous characters and PostgREST filter separators
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100) // Limit length to prevent abuse
}

/**
 * Validates that a search term is safe and non-empty
 *
 * @param searchTerm - Sanitized search term
 * @returns true if search term is valid
 */
export function isValidSearchTerm(searchTerm: string): boolean {
  const sanitized = sanitizeSearchTerm(searchTerm)
  return sanitized.length >= 2 && sanitized.length <= 100
}

/**
 * Sanitizes and validates search term in one call
 *
 * @param searchTerm - Raw user input
 * @returns Object with sanitized term and validity
 *
 * @example
 * ```typescript
 * const { term, isValid } = sanitizeAndValidate(userInput)
 * if (!isValid) {
 *   return { error: 'Search term must be 2-100 characters' }
 * }
 * query.or(`first_name.ilike.%${term}%`)
 * ```
 */
export function sanitizeAndValidate(searchTerm: string): {
  term: string
  isValid: boolean
  error?: string
} {
  const sanitized = sanitizeSearchTerm(searchTerm)

  if (sanitized.length < 2) {
    return {
      term: sanitized,
      isValid: false,
      error: 'Search term must be at least 2 characters',
    }
  }

  if (sanitized.length > 100) {
    return {
      term: sanitized,
      isValid: false,
      error: 'Search term must be less than 100 characters',
    }
  }

  return {
    term: sanitized,
    isValid: true,
  }
}
