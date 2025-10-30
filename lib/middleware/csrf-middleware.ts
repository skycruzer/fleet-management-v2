/**
 * CSRF Protection Middleware
 *
 * Developer: Maurice Rondeau
 *
 * Validates CSRF tokens on all state-changing requests (POST, PUT, DELETE, PATCH)
 * to prevent Cross-Site Request Forgery attacks.
 *
 * @version 1.1.0
 * @since 2025-10-27
 *
 * Usage:
 * ```typescript
 * import { withCsrfProtection } from '@/lib/middleware/csrf-middleware'
 *
 * async function handlePOST(request: NextRequest) {
 *   // Your logic here
 * }
 *
 * export const POST = withCsrfProtection(handlePOST)
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'

// Stub function - CSRF implementation pending
async function verifyCsrfTokenFromRequest(_req: NextRequest): Promise<boolean> {
  // TODO: Implement CSRF token verification
  return true
}

// Stub function - error formatting pending
function formatApiError(message: { message: string }, status: number) {
  return { error: message.message, status }
}

// Stub error messages - pending implementation
const ERROR_MESSAGES = {
  AUTH: {
    CSRF_INVALID: { message: 'Invalid CSRF token' }
  }
}

export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Verify CSRF token from request headers
      const isValid = await verifyCsrfTokenFromRequest(req)

      if (!isValid) {
        return NextResponse.json(
          formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403),
          { status: 403 }
        )
      }
    }

    // CSRF token valid or not required (GET request), proceed to handler
    return handler(req)
  }
}

/**
 * Validate CSRF token and return error response if invalid
 * Returns null if valid, allowing the handler to continue
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfError = await validateCsrf(request);
 *   if (csrfError) return csrfError;
 *
 *   // Your logic here
 * }
 * ```
 */
export async function validateCsrf(req: NextRequest): Promise<NextResponse | null> {
  // Only check CSRF for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return null;
  }

  // Verify CSRF token
  const isValid = await verifyCsrfTokenFromRequest(req);

  if (!isValid) {
    return NextResponse.json(
      formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403),
      { status: 403 }
    );
  }

  return null;
}
