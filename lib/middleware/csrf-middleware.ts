/**
 * CSRF Protection Middleware
 *
 * Developer: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Validates CSRF tokens on all state-changing requests (POST, PUT, DELETE, PATCH)
 * to prevent Cross-Site Request Forgery attacks.
 *
 * @version 2.0.0 - SECURITY: Fully implemented CSRF protection
 * @since 2025-10-27
 *
 * Security Implementation:
 * - Double Submit Cookie pattern (stateless CSRF protection)
 * - Cryptographically secure random tokens
 * - Token validation on all mutations
 * - Automatic token rotation
 *
 * `validateCsrf` is the only entry point, and it fails CLOSED: a mutation
 * without a valid token is always rejected. A previous `withCsrfProtection`
 * wrapper allowed unlisted paths through when no token header was present —
 * i.e. it failed open for any route not in a hardcoded allowlist. It was unused
 * and has been removed rather than left as a foot-gun that reads as protective.
 *
 * Usage:
 * ```typescript
 * import { validateCsrf } from '@/lib/middleware/csrf-middleware'
 *
 * export async function POST(request: NextRequest) {
 *   const csrfError = await validateCsrf(request)
 *   if (csrfError) return csrfError
 *   // Your logic here
 * }
 * ```
 *
 * Routes built with `createAdminRoute` / `createPilotRoute` get this
 * automatically — do not call it by hand there.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * CSRF token cookie name
 */
const CSRF_COOKIE_NAME = 'csrf-token'

/**
 * CSRF token header name (must match client-side implementation)
 */
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Format API error response
 */
function formatApiError(message: { message: string }, status: number) {
  return { error: message.message, status }
}

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  AUTH: {
    CSRF_INVALID: {
      message:
        process.env.NODE_ENV === 'development'
          ? 'CSRF validation failed in development mode. This should not happen - check console for details.'
          : 'Invalid or missing CSRF token. Please refresh the page and try again.',
    },
  },
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
    return null
  }

  // When validateCsrf is called explicitly, always require the token
  // (unlike withCsrfProtection which uses a route allowlist for broad application)
  try {
    const token = req.headers.get(CSRF_HEADER_NAME) || req.headers.get('X-CSRF-Token')
    if (!token) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403), {
        status: 403,
      })
    }

    const secret = req.cookies.get('csrf_secret')?.value
    if (!secret) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403), {
        status: 403,
      })
    }

    const Tokens = (await import('csrf')).default
    const tokens = new Tokens()
    if (!tokens.verify(secret, token)) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403), {
        status: 403,
      })
    }
  } catch {
    return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.CSRF_INVALID, 403), { status: 403 })
  }

  return null
}
