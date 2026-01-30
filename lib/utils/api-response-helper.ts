/**
 * API Response Helper Utilities
 * Author: Maurice Rondeau
 *
 * Provides consistent response handling for API routes.
 * Bridges legacy throw-based services with ServiceResponse pattern.
 *
 * @version 1.0.0
 * @since 2026-01
 */

import { NextResponse } from 'next/server'
import { ServiceResponse, isSuccess } from '@/lib/types/service-response'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * HTTP status codes for common scenarios
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Map ServiceResponse error codes to HTTP status codes
 */
const ERROR_CODE_TO_STATUS: Record<string, number> = {
  UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
  FORBIDDEN: HTTP_STATUS.FORBIDDEN,
  NOT_FOUND: HTTP_STATUS.NOT_FOUND,
  VALIDATION_ERROR: HTTP_STATUS.BAD_REQUEST,
  CONFLICT: HTTP_STATUS.CONFLICT,
  RATE_LIMIT_EXCEEDED: HTTP_STATUS.TOO_MANY_REQUESTS,
}

/**
 * Convert ServiceResponse to NextResponse
 * Handles both success and error cases with proper HTTP status codes
 */
export function serviceResponseToHttp<T>(
  response: ServiceResponse<T>,
  options?: {
    successStatus?: number
    endpoint?: string
    operation?: string
  }
): NextResponse {
  if (isSuccess(response)) {
    return NextResponse.json(
      {
        success: true,
        data: response.data,
        metadata: response.metadata,
      },
      { status: options?.successStatus || HTTP_STATUS.OK }
    )
  }

  // Determine HTTP status from error code
  const status = response.errorCode
    ? ERROR_CODE_TO_STATUS[response.errorCode] || HTTP_STATUS.INTERNAL_SERVER_ERROR
    : HTTP_STATUS.INTERNAL_SERVER_ERROR

  return NextResponse.json(
    {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
      validationErrors: response.validationErrors,
    },
    { status }
  )
}

/**
 * Execute a service function that throws and convert to ServiceResponse
 * Useful for wrapping legacy services that don't return ServiceResponse
 */
export async function executeService<T>(
  operation: () => Promise<T>,
  context?: {
    operation?: string
    endpoint?: string
  }
): Promise<ServiceResponse<T>> {
  try {
    const result = await operation()
    return ServiceResponse.success(result)
  } catch (error) {
    const sanitized = sanitizeError(error, context)
    return ServiceResponse.error(
      sanitized.error || 'An error occurred',
      error,
      sanitized.statusCode === 404
        ? 'NOT_FOUND'
        : sanitized.statusCode === 401
          ? 'UNAUTHORIZED'
          : sanitized.statusCode === 403
            ? 'FORBIDDEN'
            : undefined
    )
  }
}

/**
 * Execute a service function and return NextResponse directly
 * Combines executeService and serviceResponseToHttp for convenience
 */
export async function executeAndRespond<T>(
  operation: () => Promise<T>,
  options?: {
    successStatus?: number
    operation?: string
    endpoint?: string
  }
): Promise<NextResponse> {
  const result = await executeService(operation, {
    operation: options?.operation,
    endpoint: options?.endpoint,
  })
  return serviceResponseToHttp(result, options)
}

/**
 * Create a success response with optional metadata
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number
    message?: string
    metadata?: Record<string, unknown>
  }
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message: options?.message,
      ...options?.metadata,
    },
    { status: options?.status || HTTP_STATUS.OK }
  )
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  options?: {
    status?: number
    errorCode?: string
    details?: unknown
  }
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode: options?.errorCode,
      details: options?.details,
    },
    { status: options?.status || HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  errors: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode: 'VALIDATION_ERROR',
      validationErrors: errors,
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  )
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode: 'UNAUTHORIZED',
    },
    { status: HTTP_STATUS.UNAUTHORIZED }
  )
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode: 'FORBIDDEN',
    },
    { status: HTTP_STATUS.FORBIDDEN }
  )
}

/**
 * Create a not found response
 */
export function notFoundResponse(message = 'Resource not found'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errorCode: 'NOT_FOUND',
    },
    { status: HTTP_STATUS.NOT_FOUND }
  )
}
