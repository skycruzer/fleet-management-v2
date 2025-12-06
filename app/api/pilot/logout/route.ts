/**
 * Pilot Logout API Route
 * POST /api/pilot/logout
 *
 * Terminates the pilot user's session.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * POST /api/pilot/logout
 * Terminate pilot session
 *
 * @returns 200 with success message or 500 with error
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.PORTAL.LOGOUT_FAILED.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Pilot logout error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'pilotLogout',
      endpoint: '/api/pilot/logout',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
