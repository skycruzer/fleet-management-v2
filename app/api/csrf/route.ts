/**
 * CSRF Token API Route
 * Provides CSRF tokens to authenticated clients
 *
 * Developer: Maurice Rondeau
 * Date: November 4, 2025
 *
 * @version 2.0.0 - SECURITY: Fully implemented CSRF token generation
 * @since 2025-10-27
 *
 * Security Implementation:
 * - Generates cryptographically secure tokens
 * - Sets token in HTTP-only cookie
 * - Returns token for client-side storage
 * - Double Submit Cookie pattern
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCsrfToken } from '@/lib/middleware/csrf-middleware'

/**
 * CSRF token cookie name
 */
const CSRF_COOKIE_NAME = 'csrf-token'

/**
 * GET /api/csrf
 * Generates a new CSRF token and returns it to the client
 * Client must:
 * 1. Store the token (e.g., in memory or sessionStorage)
 * 2. Include token in X-CSRF-Token header for all mutations
 */
export async function GET() {
  try {
    // Generate cryptographically secure token
    const token = generateCsrfToken()

    // Set token in HTTP-only cookie (server-side verification)
    const cookieStore = await cookies()
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    // Return token to client (client-side header inclusion)
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
