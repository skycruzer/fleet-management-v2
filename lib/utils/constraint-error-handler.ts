/**
 * Constraint Error Handler Utility
 * Provides helper functions to detect and format unique constraint violations
 *
 * @version 1.0.0
 * @since 2025-10-19
 * @related-todo 037-ready-p1-missing-unique-constraints.md
 */

import { ERROR_MESSAGES } from './error-messages'

/**
 * PostgreSQL error codes
 */
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const

/**
 * Custom error class for duplicate submissions
 */
export class DuplicateSubmissionError extends Error {
  constructor(
    message: string,
    public readonly constraint: string,
    public readonly table: string
  ) {
    super(message)
    this.name = 'DuplicateSubmissionError'
  }
}

/**
 * Constraint-specific error messages
 * Maps constraint names to user-friendly error messages
 *
 * NOTE (Sprint 1.1 - Nov 2025): Migrated to unified pilot_requests table
 * - leave_requests → pilot_requests (request_category='LEAVE')
 * - flight_requests → pilot_requests (request_category='FLIGHT')
 * Legacy constraint names kept for backward compatibility
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Leave requests (legacy table + unified table)
  leave_requests_pilot_dates_unique: ERROR_MESSAGES.LEAVE.DUPLICATE_REQUEST.message,
  pilot_requests_pilot_dates_unique: ERROR_MESSAGES.LEAVE.DUPLICATE_REQUEST.message,

  // Flight requests (legacy table + unified table)
  flight_requests_pilot_date_type_unique: ERROR_MESSAGES.FLIGHT.DUPLICATE_REQUEST.message,
  pilot_requests_pilot_date_type_unique: ERROR_MESSAGES.FLIGHT.DUPLICATE_REQUEST.message,

  // Feedback
  feedback_likes_post_user_unique: ERROR_MESSAGES.FEEDBACK.ALREADY_VOTED.message,
  feedback_posts_title_unique: ERROR_MESSAGES.FEEDBACK.CREATE_FAILED.message,

  // Pilot registrations
  pilot_registrations_email_unique: ERROR_MESSAGES.PORTAL.DUPLICATE_REGISTRATION.message,
  pilot_registrations_employee_id_unique: 'A pilot with this employee ID has already registered.',

  // Pilots
  pilots_employee_id_unique: ERROR_MESSAGES.PILOT.DUPLICATE_EMPLOYEE_ID.message,

  // Users
  an_users_email_unique: ERROR_MESSAGES.USER.DUPLICATE_EMAIL.message,

  // Tasks (if any unique constraints added later)
  tasks_title_unique: 'A task with this title already exists.',

  // Feedback categories
  feedback_categories_name_unique: ERROR_MESSAGES.FEEDBACK.INVALID_CATEGORY.message,
}

/**
 * Check if error is a PostgreSQL unique constraint violation
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const pgError = error as { code?: string; message?: string }
  return pgError.code === PG_ERROR_CODES.UNIQUE_VIOLATION
}

/**
 * Extract constraint name from PostgreSQL error message
 */
export function extractConstraintName(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const pgError = error as { message?: string }
  if (!pgError.message) return null

  // PostgreSQL error format: 'duplicate key value violates unique constraint "constraint_name"'
  const match = pgError.message.match(/unique constraint "([^"]+)"/)
  return match ? match[1] : null
}

/**
 * Get user-friendly error message for a constraint violation
 */
export function getConstraintErrorMessage(constraintName: string): string {
  return (
    CONSTRAINT_MESSAGES[constraintName] ||
    'This record already exists. Please check your existing submissions.'
  )
}

/**
 * Convert PostgreSQL unique constraint error to user-friendly error
 *
 * @param error - PostgreSQL error object
 * @returns DuplicateSubmissionError with user-friendly message
 *
 * @example
 * try {
 *   await supabase.from('leave_requests').insert(data)
 * } catch (error) {
 *   if (isUniqueConstraintViolation(error)) {
 *     throw handleUniqueConstraintViolation(error)
 *   }
 * }
 */
export function handleUniqueConstraintViolation(error: unknown): DuplicateSubmissionError {
  const constraintName = extractConstraintName(error)

  if (!constraintName) {
    return new DuplicateSubmissionError('This record already exists.', 'unknown', 'unknown')
  }

  const message = getConstraintErrorMessage(constraintName)
  const table = constraintName.split('_')[0] // Extract table name from constraint

  return new DuplicateSubmissionError(message, constraintName, table)
}

/**
 * Check if error is a duplicate submission error
 */
export function isDuplicateSubmissionError(error: unknown): error is DuplicateSubmissionError {
  return error instanceof DuplicateSubmissionError
}

/**
 * Convenience function to handle constraint errors and return user-friendly message
 * This is a simpler wrapper around handleUniqueConstraintViolation
 */
export function handleConstraintError(error: unknown): string {
  if (isUniqueConstraintViolation(error)) {
    const duplicateError = handleUniqueConstraintViolation(error)
    return duplicateError.message
  }
  return 'An error occurred. Please try again.'
}

/**
 * Format error for API response
 */
export function formatConstraintErrorResponse(error: DuplicateSubmissionError) {
  return {
    success: false,
    error: error.message,
    errorType: 'duplicate',
    constraint: error.constraint,
    table: error.table,
  }
}

/**
 * Helper to wrap database operations with constraint error handling
 *
 * @example
 * const result = await withConstraintErrorHandling(
 *   async () => supabase.from('leave_requests').insert(data)
 * )
 */
export async function withConstraintErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw handleUniqueConstraintViolation(error)
    }
    throw error
  }
}
