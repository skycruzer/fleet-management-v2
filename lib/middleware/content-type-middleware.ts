/**
 * Content-Type Validation Middleware
 *
 * Developer: Maurice Rondeau
 * Date: January 2026
 *
 * Validates Content-Type headers on state-changing requests (POST, PUT, PATCH)
 * to ensure proper JSON payload handling and prevent malformed requests.
 *
 * @version 1.0.0
 *
 * Usage:
 * ```typescript
 * import { validateContentType } from '@/lib/middleware/content-type-middleware'
 *
 * export async function POST(request: NextRequest) {
 *   const contentTypeError = validateContentType(request)
 *   if (contentTypeError) return contentTypeError
 *
 *   // Your logic here
 * }
 * ```
 *
 * Or use the higher-order function:
 * ```typescript
 * import { withContentType } from '@/lib/middleware/content-type-middleware'
 *
 * export const POST = withContentType(async (request) => {
 *   // Your logic here - Content-Type already validated
 * })
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  formatApiError,
  ERROR_MESSAGES,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/utils/error-messages'

/**
 * Check if a content type header indicates JSON
 * Accepts application/json with any charset variant
 */
function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false
  return contentType.toLowerCase().trim().startsWith('application/json')
}

/**
 * Validate Content-Type header for JSON requests
 *
 * Returns null if valid, or a NextResponse with 415 Unsupported Media Type if invalid
 *
 * @param request - The incoming request
 * @param options - Optional configuration
 * @returns null if valid, NextResponse if invalid
 */
export function validateContentType(
  request: NextRequest,
  options: {
    /** Allow empty body without Content-Type header (default: false) */
    allowEmptyBody?: boolean
    /** Custom error message */
    errorMessage?: string
  } = {}
): NextResponse | null {
  const { allowEmptyBody = false, errorMessage } = options
  const contentType = request.headers.get('content-type')

  // If allowEmptyBody is true and there's no content-type, allow the request
  // This handles cases like DELETE requests that may not have a body
  if (allowEmptyBody && !contentType) {
    return null
  }

  // Validate Content-Type is JSON
  if (!isJsonContentType(contentType)) {
    const message = errorMessage || 'Content-Type must be application/json'

    return NextResponse.json(
      formatApiError(
        {
          message,
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.ERROR,
        },
        415
      ),
      {
        status: 415,
        headers: {
          Accept: 'application/json',
        },
      }
    )
  }

  return null
}

/**
 * Higher-order function to wrap API handlers with Content-Type validation
 *
 * @param handler - The API route handler function
 * @param options - Optional configuration
 * @returns Content-Type validated handler
 */
export function withContentType(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    allowEmptyBody?: boolean
    errorMessage?: string
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate Content-Type
    const contentTypeError = validateContentType(request, options)
    if (contentTypeError) {
      return contentTypeError
    }

    // Content-Type valid, proceed with handler
    return handler(request)
  }
}

export default validateContentType
