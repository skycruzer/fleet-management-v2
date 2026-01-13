/**
 * CSRF Token API Route
 * Provides CSRF tokens to authenticated clients
 *
 * Developer: Maurice Rondeau
 * Date: November 4, 2025
 *
 * @version 2.1.0 - SECURITY: Using cryptographic CSRF tokens with secrets
 * @since 2025-10-27
 *
 * Security Implementation:
 * - Generates cryptographically secure token using 'csrf' package
 * - Sets secret in HTTP-only cookie (for verification)
 * - Sets token in accessible cookie (for client to read)
 * - Returns token for client-side storage
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as CsrfTokens from 'csrf'

const Tokens = CsrfTokens.default || CsrfTokens
const tokens = new Tokens()

/**
 * Cookie configuration
 */
const CSRF_SECRET_COOKIE = 'csrf_secret'
const CSRF_TOKEN_COOKIE = 'csrf-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * GET /api/csrf
 * Generates a new CSRF secret and token pair
 * Client must:
 * 1. Store the token (automatically set in cookie)
 * 2. Include token in X-CSRF-Token header for all mutations
 */
export async function GET() {
  try {
    const cookieStore = await cookies()

    // Check for existing secret
    let secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value

    // Generate new secret if none exists
    if (!secret) {
      secret = tokens.secretSync()

      // Set secret in HTTP-only cookie (used for verification)
      cookieStore.set(CSRF_SECRET_COOKIE, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })
    }

    // Generate token from secret
    const token = tokens.create(secret)

    // Set token in accessible cookie (client reads this for header)
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    // Return token to client
    return NextResponse.json({
      success: true,
      csrfToken: token,
    })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/csrf
 * Regenerates a new CSRF token (for token rotation)
 */
export async function POST() {
  try {
    const cookieStore = await cookies()

    // Always generate new secret on POST (token rotation)
    const secret = tokens.secretSync()
    const token = tokens.create(secret)

    // Set new secret
    cookieStore.set(CSRF_SECRET_COOKIE, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    // Set new token
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return NextResponse.json({
      success: true,
      csrfToken: token,
    })
  } catch (error) {
    console.error('Error regenerating CSRF token:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate CSRF token' },
      { status: 500 }
    )
  }
}
