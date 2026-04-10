/**
 * CSRF Protection Utility
 * Provides token generation and verification for cross-site request forgery protection
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2025-10-27
 */

import Tokens from 'csrf'
import { cookies } from 'next/headers'

const tokens = new Tokens()

// Cookie configuration
const CSRF_SECRET_COOKIE = 'csrf_secret'
const CSRF_TOKEN_COOKIE = 'csrf-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * Generate a new CSRF secret
 */
export function generateCsrfSecret(): string {
  return tokens.secretSync()
}

/**
 * Generate a CSRF token from a secret
 */
export function generateCsrfToken(secret: string): string {
  return tokens.create(secret)
}

/**
 * Verify a CSRF token against a secret
 */
export function verifyCsrfToken(secret: string, token: string): boolean {
  return tokens.verify(secret, token)
}

/**
 * Get CSRF secret from cookies (server-side)
 * Creates a new secret if one doesn't exist
 */
export async function getCsrfSecret(): Promise<string> {
  const cookieStore = await cookies()
  let secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value

  if (!secret) {
    secret = generateCsrfSecret()
    await setCsrfSecret(secret)
  }

  return secret
}

/**
 * Set CSRF secret in cookies (server-side)
 */
export async function setCsrfSecret(secret: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_SECRET_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Get CSRF token from cookies (server-side)
 * Generates a new token if one doesn't exist
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value

  if (!token) {
    const secret = await getCsrfSecret()
    token = generateCsrfToken(secret)
    await setCsrfToken(token)
  }

  return token
}

/**
 * Set CSRF token in cookies (server-side)
 */
export async function setCsrfToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Allow JavaScript access for form submissions
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Verify CSRF token from request (server-side)
 * Checks both headers and body for token
 * Note: If token is in body, this consumes the request body
 */
export async function verifyCsrfTokenFromRequest(request: Request): Promise<boolean> {
  try {
    // Get secret from cookies
    const secret = await getCsrfSecret()

    // Try to get token from header first (preferred)
    const token = request.headers.get('X-CSRF-Token') || request.headers.get('x-csrf-token')

    if (!token) {
      return false // Require token in header to avoid consuming request body
    }

    return verifyCsrfToken(secret, token)
  } catch (error) {
    console.error('CSRF verification error:', error)
    return false
  }
}

/**
 * Verify CSRF token from request body (server-side)
 * WARNING: This consumes the request body. Use only when you need to read body anyway.
 * Returns both verification result and the parsed body
 */
export async function verifyCsrfTokenFromBody(
  request: Request
): Promise<{ isValid: boolean; body: any }> {
  try {
    const secret = await getCsrfSecret()
    const contentType = request.headers.get('content-type') || ''

    let token: string | undefined
    let body: any

    if (contentType.includes('application/json')) {
      body = await request.json()
      token = body.csrf_token || body.csrfToken
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData()
      token = formData.get('csrf_token')?.toString() || formData.get('csrfToken')?.toString()
      body = Object.fromEntries(formData)
    } else {
      return { isValid: false, body: null }
    }

    if (!token) {
      return { isValid: false, body }
    }

    const isValid = verifyCsrfToken(secret, token)
    return { isValid, body }
  } catch (error) {
    console.error('CSRF body verification error:', error)
    return { isValid: false, body: null }
  }
}

/**
 * Generate new CSRF token pair (secret + token)
 * Used for initial setup and token rotation
 */
export async function generateNewCsrfTokenPair(): Promise<{ secret: string; token: string }> {
  const secret = generateCsrfSecret()
  const token = generateCsrfToken(secret)

  await setCsrfSecret(secret)
  await setCsrfToken(token)

  return { secret, token }
}

/**
 * Clear CSRF tokens from cookies
 * Used for logout or token rotation
 */
export async function clearCsrfTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_SECRET_COOKIE)
  cookieStore.delete(CSRF_TOKEN_COOKIE)
}
