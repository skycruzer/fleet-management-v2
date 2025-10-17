/**
 * CSRF (Cross-Site Request Forgery) Protection System
 *
 * Provides token generation and validation to protect against CSRF attacks.
 * Uses cryptographically secure random tokens stored in httpOnly cookies.
 *
 * @module lib/csrf
 * @see https://owasp.org/www-community/attacks/csrf
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

/**
 * Cookie configuration for CSRF tokens
 */
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_TOKEN_LENGTH = 32 // 32 bytes = 256 bits
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

/**
 * Generates a cryptographically secure CSRF token and stores it in an httpOnly cookie.
 *
 * The token is:
 * - 32 bytes (256 bits) of cryptographically secure random data
 * - Hex-encoded for safe transmission
 * - Stored in an httpOnly, secure, sameSite=strict cookie
 *
 * @returns {Promise<string>} The generated CSRF token (hex-encoded)
 *
 * @example
 * ```tsx
 * // In a Server Component or Server Action
 * const csrfToken = await generateCsrfToken()
 *
 * // Pass to form
 * <form>
 *   <input type="hidden" name="csrf_token" value={csrfToken} />
 * </form>
 * ```
 */
export async function generateCsrfToken(): Promise<string> {
  // Generate cryptographically secure random bytes
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')

  // Get Next.js cookie store (async in Next.js 15)
  const cookieStore = await cookies()

  // Set cookie with security options
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true, // Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Strict same-site policy (no cross-origin requests)
    maxAge: CSRF_TOKEN_MAX_AGE, // 24-hour expiration
    path: '/', // Available to all routes
  })

  return token
}

/**
 * Validates a CSRF token against the stored cookie value.
 *
 * Performs constant-time comparison to prevent timing attacks.
 *
 * @param {string} token - The CSRF token to validate (from form data or request headers)
 * @returns {Promise<boolean>} True if token is valid and matches cookie, false otherwise
 *
 * @example
 * ```tsx
 * // In API Route Handler
 * export async function POST(request: Request) {
 *   const formData = await request.formData()
 *   const csrfToken = formData.get('csrf_token') as string
 *
 *   if (!await validateCsrfToken(csrfToken)) {
 *     return NextResponse.json(
 *       { error: 'Invalid CSRF token' },
 *       { status: 403 }
 *     )
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  // Check if token is provided
  if (!token || typeof token !== 'string') {
    return false
  }

  // Get Next.js cookie store (async in Next.js 15)
  const cookieStore = await cookies()

  // Retrieve stored token from cookie
  const storedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  // Check if cookie exists
  if (!storedToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  // Both tokens must be the same length and contain only valid hex characters
  if (storedToken.length !== token.length) {
    return false
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    const storedBuffer = Buffer.from(storedToken, 'hex')
    const tokenBuffer = Buffer.from(token, 'hex')

    // timingSafeEqual throws if lengths don't match, so we check above
    return storedBuffer.length === tokenBuffer.length &&
           require('crypto').timingSafeEqual(storedBuffer, tokenBuffer)
  } catch (error) {
    // Invalid hex encoding or other error
    return false
  }
}

/**
 * Deletes the CSRF token cookie.
 *
 * Useful for logout flows or when invalidating sessions.
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```tsx
 * // In logout Server Action
 * await deleteCsrfToken()
 * ```
 */
export async function deleteCsrfToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}

/**
 * Middleware-compatible CSRF validation.
 *
 * Can be used in Next.js middleware to validate CSRF tokens
 * before requests reach route handlers.
 *
 * @param {Request} request - The incoming request
 * @returns {Promise<boolean>} True if CSRF token is valid
 *
 * @example
 * ```tsx
 * // In middleware.ts
 * import { validateCsrfFromRequest } from '@/lib/csrf'
 *
 * export async function middleware(request: NextRequest) {
 *   if (request.method !== 'GET' && request.method !== 'HEAD') {
 *     const isValid = await validateCsrfFromRequest(request)
 *     if (!isValid) {
 *       return new NextResponse('Invalid CSRF token', { status: 403 })
 *     }
 *   }
 *   return NextResponse.next()
 * }
 * ```
 */
export async function validateCsrfFromRequest(request: Request): Promise<boolean> {
  // Extract token from request
  let token: string | null = null

  // Check common locations for CSRF token

  // 1. Check request headers (X-CSRF-Token)
  token = request.headers.get('X-CSRF-Token')

  // 2. If not in headers, check form data (for POST requests)
  if (!token && request.method === 'POST') {
    try {
      const formData = await request.formData()
      token = formData.get('csrf_token') as string
    } catch {
      // Not form data, might be JSON
    }
  }

  // 3. If not in form data, check JSON body
  if (!token) {
    try {
      const body = await request.json()
      token = body.csrf_token
    } catch {
      // Not JSON or already consumed
    }
  }

  // Validate token if found
  if (!token) {
    return false
  }

  return validateCsrfToken(token)
}

/**
 * Type definition for CSRF-protected form props
 */
export interface CsrfProtectedFormProps {
  /** The CSRF token to include in the form */
  csrfToken: string
}

/**
 * Helper function to create CSRF-protected form data.
 *
 * Automatically adds the CSRF token to FormData objects.
 *
 * @param {FormData} formData - The form data to protect
 * @param {string} csrfToken - The CSRF token
 * @returns {FormData} The form data with CSRF token added
 *
 * @example
 * ```tsx
 * const formData = new FormData(form)
 * const protectedFormData = addCsrfToFormData(formData, csrfToken)
 * await fetch('/api/pilots', { method: 'POST', body: protectedFormData })
 * ```
 */
export function addCsrfToFormData(formData: FormData, csrfToken: string): FormData {
  formData.append('csrf_token', csrfToken)
  return formData
}

/**
 * Helper function to create CSRF-protected JSON payloads.
 *
 * Automatically adds the CSRF token to JSON objects.
 *
 * @param {Record<string, any>} payload - The JSON payload
 * @param {string} csrfToken - The CSRF token
 * @returns {Record<string, any>} The payload with CSRF token added
 *
 * @example
 * ```tsx
 * const payload = { name: 'John Doe', rank: 'Captain' }
 * const protectedPayload = addCsrfToJson(payload, csrfToken)
 * await fetch('/api/pilots', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(protectedPayload)
 * })
 * ```
 */
export function addCsrfToJson(
  payload: Record<string, any>,
  csrfToken: string
): Record<string, any> {
  return {
    ...payload,
    csrf_token: csrfToken,
  }
}
