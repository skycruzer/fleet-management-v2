/**
 * Type Guards for Runtime Type Validation
 *
 * Provides runtime validation functions to ensure data conforms to expected types,
 * particularly for JSONB columns and API responses.
 *
 * @module lib/utils/type-guards
 */

import type { CaptainQualifications } from '../../types/pilot'
import { logWarning } from '../error-logger'

/**
 * Type guard to check if a value is a valid CaptainQualifications object
 *
 * @param value - The value to check
 * @returns True if the value is a valid CaptainQualifications object
 *
 * @example
 * ```typescript
 * const qualifications = pilot.captain_qualifications
 * if (isCaptainQualifications(qualifications)) {
 *   // TypeScript now knows qualifications is CaptainQualifications
 *   console.log(qualifications.line_captain)
 * }
 * ```
 */
export function isCaptainQualifications(value: unknown): value is CaptainQualifications {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value !== 'object') {
    return false
  }

  const obj = value as Record<string, unknown>

  // Check that all properties (if present) have correct types
  if ('line_captain' in obj && typeof obj.line_captain !== 'boolean') {
    return false
  }

  if ('training_captain' in obj && typeof obj.training_captain !== 'boolean') {
    return false
  }

  if ('examiner' in obj && typeof obj.examiner !== 'boolean') {
    return false
  }

  if ('rhs_captain_expiry' in obj && typeof obj.rhs_captain_expiry !== 'string') {
    return false
  }

  // All checks passed
  return true
}

/**
 * Validates and parses captain qualifications from unknown data
 *
 * This function ensures that the data is valid and returns a properly typed
 * CaptainQualifications object or null. It handles both:
 * - Object format: {line_captain: true, training_captain: false, examiner: true}
 * - Array format: ["line_captain", "training_captain", "examiner"]
 *
 * @param value - The value to validate and parse
 * @returns A valid CaptainQualifications object or null
 *
 * @example
 * ```typescript
 * const rawData = await fetchPilot()
 * const qualifications = parseCaptainQualifications(rawData.captain_qualifications)
 * ```
 */
export function parseCaptainQualifications(value: unknown): CaptainQualifications | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null
  }

  // Handle array format from database: ["line_captain", "training_captain", "examiner"]
  if (Array.isArray(value)) {
    const result: CaptainQualifications = {
      line_captain: false,
      training_captain: false,
      examiner: false,
    }

    for (const item of value) {
      if (typeof item === 'string') {
        const key = item.toLowerCase().trim()
        if (key === 'line_captain') {
          result.line_captain = true
        } else if (key === 'training_captain') {
          result.training_captain = true
        } else if (key === 'examiner') {
          result.examiner = true
        }
      }
    }

    return result
  }

  // Validate the object structure
  if (!isCaptainQualifications(value)) {
    logWarning('Invalid captain qualifications structure', {
      source: 'TypeGuards',
      metadata: {
        operation: 'parseCaptainQualifications',
        value: JSON.stringify(value),
      },
    })
    return null
  }

  return value
}

/**
 * Type guard to check if a value is a valid ISO 8601 date string
 *
 * @param value - The value to check
 * @returns True if the value is a valid ISO 8601 date string
 *
 * @example
 * ```typescript
 * if (isISODateString(qualifications.rhs_captain_expiry)) {
 *   const date = new Date(qualifications.rhs_captain_expiry)
 * }
 * ```
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const date = new Date(value)
  return !isNaN(date.getTime()) && value === date.toISOString()
}

/**
 * Validates a date string and returns a Date object or null
 *
 * @param value - The date string to validate
 * @returns A Date object or null if invalid
 *
 * @example
 * ```typescript
 * const expiryDate = parseISODateString(qualifications.rhs_captain_expiry)
 * if (expiryDate) {
 *   console.log('Expires:', expiryDate.toLocaleDateString())
 * }
 * ```
 */
export function parseISODateString(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null
  }

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return null
  }

  return date
}

/**
 * Sanitizes captain qualifications by ensuring all fields have valid types
 *
 * This function is useful when dealing with potentially malformed data from
 * external sources or user input.
 *
 * @param value - The value to sanitize
 * @returns A valid CaptainQualifications object with all fields properly typed
 *
 * @example
 * ```typescript
 * const userInput = formData.captain_qualifications
 * const sanitized = sanitizeCaptainQualifications(userInput)
 * await updatePilot({ captain_qualifications: sanitized })
 * ```
 */
export function sanitizeCaptainQualifications(value: unknown): CaptainQualifications {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const obj = value as Record<string, unknown>
  const result: CaptainQualifications = {}

  // Sanitize boolean fields
  if ('line_captain' in obj) {
    result.line_captain = Boolean(obj.line_captain)
  }

  if ('training_captain' in obj) {
    result.training_captain = Boolean(obj.training_captain)
  }

  if ('examiner' in obj) {
    result.examiner = Boolean(obj.examiner)
  }

  // Sanitize date field
  if ('rhs_captain_expiry' in obj && typeof obj.rhs_captain_expiry === 'string') {
    const date = new Date(obj.rhs_captain_expiry)
    if (!isNaN(date.getTime())) {
      result.rhs_captain_expiry = date.toISOString()
    }
  }

  return result
}

/**
 * Creates a default/empty CaptainQualifications object
 *
 * @returns An empty CaptainQualifications object with all fields set to false/null
 *
 * @example
 * ```typescript
 * const defaultQualifications = createDefaultCaptainQualifications()
 * // { line_captain: false, training_captain: false, examiner: false }
 * ```
 */
export function createDefaultCaptainQualifications(): CaptainQualifications {
  return {
    line_captain: false,
    training_captain: false,
    examiner: false,
    rhs_captain_expiry: undefined,
  }
}

/**
 * Type guard to check if an object has a property with a specific type
 *
 * @param obj - The object to check
 * @param key - The property key to check
 * @param typeCheck - A function that checks the type of the property value
 * @returns True if the property exists and has the correct type
 *
 * @example
 * ```typescript
 * if (hasTypedProperty(obj, 'line_captain', (v): v is boolean => typeof v === 'boolean')) {
 *   console.log(obj.line_captain)
 * }
 * ```
 */
export function hasTypedProperty<T>(
  obj: unknown,
  key: string,
  typeCheck: (value: unknown) => value is T
): obj is Record<string, T> {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  return key in obj && typeCheck((obj as Record<string, unknown>)[key])
}
