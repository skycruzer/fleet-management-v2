/**
 * Error Sanitization Utility
 *
 * Sanitizes error messages to prevent information leakage in production
 * while preserving detailed errors for development and logging.
 *
 * @version 1.0.0 - SECURITY: Error message sanitization
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

import { nanoid } from 'nanoid'
import { Logtail } from '@logtail/node'

let logtail: Logtail | null = null

function getLogtail(): Logtail | null {
  if (logtail) return logtail

  const token = process.env.LOGTAIL_SOURCE_TOKEN
  if (!token) return null

  try {
    logtail = new Logtail(token)
    return logtail
  } catch (error) {
    console.error('Failed to initialize Logtail:', error)
    return null
  }
}

/**
 * Sanitized error response
 */
export interface SanitizedError {
  error: string
  errorId?: string
  statusCode?: number
  details?: unknown // Only in development
  stack?: string // Only in development
}

/**
 * Environment check
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Sanitize error for client response
 *
 * @param error - Error object or message
 * @param context - Additional context for logging
 * @returns Sanitized error response
 */
export function sanitizeError(error: unknown, context?: Record<string, unknown>): SanitizedError {
  const errorId = nanoid(10)

  // Parse error details
  const errorDetails = parseError(error)

  // Log full error server-side (regardless of environment)
  logError(error, errorId, context)

  // Development: Return full error details
  if (isDevelopment) {
    return {
      error: errorDetails.message,
      errorId,
      statusCode: errorDetails.statusCode,
      details: errorDetails.details,
      stack: errorDetails.stack,
    }
  }

  // Production: Return sanitized generic message
  return {
    error: getGenericErrorMessage(errorDetails.type),
    errorId, // For support tracking
    statusCode: errorDetails.statusCode,
  }
}

/**
 * Parse error into structured format
 */
interface ParsedError {
  message: string
  type: ErrorType
  statusCode: number
  details?: unknown
  stack?: string
}

enum ErrorType {
  DATABASE = 'database',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  UNKNOWN = 'unknown',
}

function parseError(error: unknown): ParsedError {
  // Error object
  if (error instanceof Error) {
    const type = detectErrorType(error)
    return {
      message: error.message,
      type,
      statusCode: getStatusCodeForType(type),
      details: extractErrorDetails(error),
      stack: error.stack,
    }
  }

  // String error
  if (typeof error === 'string') {
    const type = detectErrorTypeFromString(error)
    return {
      message: error,
      type,
      statusCode: getStatusCodeForType(type),
    }
  }

  // Object with error property
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'string'
  ) {
    const type = detectErrorTypeFromString(error.error)
    return {
      message: error.error,
      type,
      statusCode: getStatusCodeForType(type),
      details: error,
    }
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    type: ErrorType.UNKNOWN,
    statusCode: 500,
    details: error,
  }
}

/**
 * Detect error type from Error object
 */
function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase()

  // Database errors
  if (
    message.includes('database') ||
    message.includes('postgresql') ||
    message.includes('supabase') ||
    message.includes('constraint') ||
    message.includes('duplicate key') ||
    message.includes('foreign key')
  ) {
    return ErrorType.DATABASE
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be')
  ) {
    return ErrorType.VALIDATION
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('not authenticated') ||
    message.includes('invalid credentials')
  ) {
    return ErrorType.AUTHENTICATION
  }

  // Authorization errors
  if (
    message.includes('forbidden') ||
    message.includes('authorization') ||
    message.includes('permission') ||
    message.includes('not allowed')
  ) {
    return ErrorType.AUTHORIZATION
  }

  // Rate limiting errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorType.RATE_LIMIT
  }

  // Not found errors
  if (message.includes('not found') || message.includes('does not exist')) {
    return ErrorType.NOT_FOUND
  }

  // Conflict errors
  if (
    message.includes('conflict') ||
    message.includes('already exists') ||
    message.includes('duplicate')
  ) {
    return ErrorType.CONFLICT
  }

  return ErrorType.UNKNOWN
}

/**
 * Detect error type from string message
 */
function detectErrorTypeFromString(message: string): ErrorType {
  return detectErrorType(new Error(message))
}

/**
 * Get HTTP status code for error type
 */
function getStatusCodeForType(type: ErrorType): number {
  const statusCodes: Record<ErrorType, number> = {
    [ErrorType.DATABASE]: 500,
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.CONFLICT]: 409,
    [ErrorType.UNKNOWN]: 500,
  }

  return statusCodes[type]
}

/**
 * Get generic error message for production
 */
function getGenericErrorMessage(type: ErrorType): string {
  const genericMessages: Record<ErrorType, string> = {
    [ErrorType.DATABASE]: 'A database error occurred. Please try again later.',
    [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
    [ErrorType.AUTHENTICATION]: 'Authentication failed. Please log in and try again.',
    [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ErrorType.RATE_LIMIT]: 'Too many requests. Please try again later.',
    [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorType.CONFLICT]: 'A conflict occurred. The resource may already exist.',
    [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again later.',
  }

  return genericMessages[type]
}

/**
 * Extract additional error details
 */
function extractErrorDetails(error: Error): unknown {
  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  }

  // Extract additional properties from error object
  Object.keys(error).forEach((key) => {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      details[key] = (error as unknown as Record<string, unknown>)[key]
    }
  })

  return details
}

/**
 * Log error to monitoring service (Better Stack / Logtail)
 */
function logError(error: unknown, errorId: string, context?: Record<string, unknown>): void {
  try {
    const errorDetails = parseError(error)
    const logger = getLogtail()

    if (logger) {
      logger.error('Application error', {
        errorId,
        errorType: errorDetails.type,
        errorMessage: errorDetails.message,
        statusCode: errorDetails.statusCode,
        stack: errorDetails.stack,
        context,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Fallback to console if Logtail is not available
      console.error('Application error:', {
        errorId,
        errorType: errorDetails.type,
        errorMessage: errorDetails.message,
        statusCode: errorDetails.statusCode,
        stack: errorDetails.stack,
        context,
      })
    }
  } catch (loggingError) {
    // Fallback to console if logging fails
    console.error('Error logging failed:', loggingError)
    console.error('Original error:', error)
  }
}

/**
 * Sanitize database error
 *
 * Removes sensitive information from database errors (table names, constraints, etc.)
 */
export function sanitizeDatabaseError(error: unknown): SanitizedError {
  const errorDetails = parseError(error)

  // Common database error patterns to sanitize
  const sensitivePatterns = [
    /table "(\w+)"/gi,
    /column "(\w+)"/gi,
    /constraint "(\w+)"/gi,
    /relation "(\w+)"/gi,
    /schema "(\w+)"/gi,
  ]

  let sanitizedMessage = errorDetails.message

  // Replace sensitive information with generic placeholders
  sensitivePatterns.forEach((pattern) => {
    sanitizedMessage = sanitizedMessage.replace(pattern, (match) => {
      const type = match.split(' ')[0] // "table", "column", etc.
      return `${type} [redacted]`
    })
  })

  const errorId = nanoid(10)
  logError(error, errorId, { sanitized: true })

  if (isDevelopment) {
    return {
      error: errorDetails.message,
      errorId,
      statusCode: errorDetails.statusCode,
      details: errorDetails.details,
    }
  }

  return {
    error: 'A database error occurred. Please try again later.',
    errorId,
    statusCode: 500,
  }
}

/**
 * Sanitize validation error
 *
 * Ensures validation errors don't leak internal structure
 */
export function sanitizeValidationError(errors: Record<string, string[]>): SanitizedError {
  const errorId = nanoid(10)

  // In development, return full validation errors
  if (isDevelopment) {
    return {
      error: 'Validation failed',
      errorId,
      statusCode: 400,
      details: errors,
    }
  }

  // In production, return simplified validation errors
  // Only include field names and first error message for each field
  const simplifiedErrors: Record<string, string> = {}
  Object.keys(errors).forEach((field) => {
    simplifiedErrors[field] = errors[field][0] || 'Invalid value'
  })

  return {
    error: 'Validation failed',
    errorId,
    statusCode: 400,
    details: simplifiedErrors,
  }
}

/**
 * Create safe error response for API routes
 *
 * Usage:
 * ```typescript
 * try {
 *   // API logic
 * } catch (error) {
 *   const sanitized = sanitizeError(error, { userId, operation: 'createPilot' })
 *   return NextResponse.json(sanitized, { status: sanitized.statusCode })
 * }
 * ```
 */
export function createErrorResponse(error: unknown, context?: Record<string, unknown>): Response {
  const sanitized = sanitizeError(error, context)

  return new Response(JSON.stringify(sanitized), {
    status: sanitized.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Wrap async API handler with error sanitization
 *
 * Usage:
 * ```typescript
 * export const GET = withErrorHandling(async (request) => {
 *   // Your API logic
 *   return NextResponse.json({ data })
 * })
 * ```
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return createErrorResponse(error, {
        handler: handler.name,
        args: args.length,
      })
    }
  }) as T
}
