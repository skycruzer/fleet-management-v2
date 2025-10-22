/**
 * API Response Utilities
 * Standardized response formats for all API routes
 */

import { NextResponse } from 'next/server'

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  count?: number
  meta?: Record<string, unknown> | PaginationMeta
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  details?: unknown
  code?: string
}

/**
 * API Response Type (Success or Error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a successful API response
 * @param data - The response data
 * @param options - Optional message, count, or metadata
 * @returns NextResponse with standardized success format
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string
    count?: number
    meta?: Record<string, unknown> | PaginationMeta
    status?: number
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  }

  if (options?.message) {
    response.message = options.message
  }

  if (options?.count !== undefined) {
    response.count = options.count
  }

  if (options?.meta) {
    response.meta = options.meta
  }

  return NextResponse.json(response, {
    status: options?.status || 200,
  })
}

/**
 * Create a successful list response with pagination
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @param message - Optional success message
 * @returns NextResponse with standardized list format
 */
export function listResponse<T>(
  data: T[],
  pagination?: PaginationMeta,
  message?: string
): NextResponse<ApiSuccessResponse<T[]>> {
  return successResponse(data, {
    count: data.length,
    meta: pagination,
    message,
  })
}

/**
 * Create a successful created response (HTTP 201)
 * @param data - The created resource
 * @param message - Success message
 * @returns NextResponse with 201 status
 */
export function createdResponse<T>(
  data: T,
  message = 'Resource created successfully'
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, {
    message,
    status: 201,
  })
}

/**
 * Create an error API response
 * @param error - Error message
 * @param options - Optional status code, details, and error code
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  error: string,
  options?: {
    message?: string
    status?: number
    details?: unknown
    code?: string
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    message: options?.message || error,
  }

  if (options?.details) {
    response.details = options.details
  }

  if (options?.code) {
    response.code = options.code
  }

  return NextResponse.json(response, {
    status: options?.status || 500,
  })
}

/**
 * Create a not found error response (HTTP 404)
 * @param resource - The resource that was not found
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(
  resource = 'Resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, {
    message: `The requested ${resource.toLowerCase()} could not be found`,
    status: 404,
    code: 'NOT_FOUND',
  })
}

/**
 * Create an unauthorized error response (HTTP 401)
 * @param message - Optional custom message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(
  message = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse('Unauthorized', {
    message,
    status: 401,
    code: 'UNAUTHORIZED',
  })
}

/**
 * Create a forbidden error response (HTTP 403)
 * @param message - Optional custom message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(
  message = 'You do not have permission to access this resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse('Forbidden', {
    message,
    status: 403,
    code: 'FORBIDDEN',
  })
}

/**
 * Create a validation error response (HTTP 400)
 * @param message - Validation error message
 * @param details - Validation error details (e.g., Zod errors)
 * @returns NextResponse with 400 status
 */
export function validationErrorResponse(
  message = 'Validation failed',
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse('Validation Error', {
    message,
    status: 400,
    details,
    code: 'VALIDATION_ERROR',
  })
}

/**
 * Create a conflict error response (HTTP 409)
 * @param message - Conflict error message
 * @returns NextResponse with 409 status
 */
export function conflictResponse(
  message = 'Resource already exists'
): NextResponse<ApiErrorResponse> {
  return errorResponse('Conflict', {
    message,
    status: 409,
    code: 'CONFLICT',
  })
}

/**
 * Create a server error response (HTTP 500)
 * @param error - Error object or message
 * @returns NextResponse with 500 status
 */
export function serverErrorResponse(
  error?: Error | string
): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : error || 'Internal server error'

  return errorResponse('Internal Server Error', {
    message: 'An unexpected error occurred. Please try again later.',
    status: 500,
    details: process.env.NODE_ENV === 'development' ? message : undefined,
    code: 'INTERNAL_ERROR',
  })
}

/**
 * Create a bad request error response (HTTP 400)
 * @param message - Bad request message
 * @returns NextResponse with 400 status
 */
export function badRequestResponse(
  message = 'Bad request'
): NextResponse<ApiErrorResponse> {
  return errorResponse('Bad Request', {
    message,
    status: 400,
    code: 'BAD_REQUEST',
  })
}

/**
 * Create a method not allowed response (HTTP 405)
 * @param allowedMethods - List of allowed HTTP methods
 * @returns NextResponse with 405 status and Allow header
 */
export function methodNotAllowedResponse(
  allowedMethods: string[] = ['GET', 'POST']
): NextResponse<ApiErrorResponse> {
  const response = errorResponse('Method Not Allowed', {
    message: `This endpoint only supports: ${allowedMethods.join(', ')}`,
    status: 405,
    code: 'METHOD_NOT_ALLOWED',
  })

  response.headers.set('Allow', allowedMethods.join(', '))
  return response
}
