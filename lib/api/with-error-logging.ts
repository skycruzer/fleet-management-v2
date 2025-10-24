/**
 * API Route Error Logging Wrapper
 * Automatically logs errors from API routes to Better Stack
 * Usage: Wrap your route handlers with this function
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/services/logging-service'

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<Response> | Promise<NextResponse>

/**
 * Wraps an API route handler with error logging
 * Automatically logs errors to Better Stack and returns standardized error responses
 *
 * @example
 * export const GET = withErrorLogging(async (request) => {
 *   const data = await fetchData()
 *   return NextResponse.json({ success: true, data })
 * })
 */
export function withErrorLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const startTime = Date.now()
    const url = request.url
    const method = request.method

    try {
      // Execute the route handler
      const response = await handler(request, context)
      const duration = Date.now() - startTime
      const statusCode = response.status

      // Log successful requests (info level)
      if (statusCode < 400) {
        logger.info('API request successful', {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
        })
      }
      // Log client errors (warn level)
      else if (statusCode < 500) {
        logger.warn('API client error', {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
        })
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log server errors (error level)
      logger.error('API request failed', {
        method,
        url,
        error: error instanceof Error ? error : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${duration}ms`,
      })

      // Return standardized error response
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Type-safe error response helper
 * Logs error and returns standardized JSON response
 */
export function errorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  const errorStack = error instanceof Error ? error.stack : undefined

  logger.error('Error response generated', {
    error: errorMessage,
    stack: errorStack,
    statusCode,
    ...context,
  })

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status: statusCode }
  )
}

/**
 * Success response helper with optional logging
 */
export function successResponse<T>(data: T, statusCode: number = 200, logMessage?: string) {
  if (logMessage) {
    logger.info(logMessage, { statusCode })
  }

  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  )
}
