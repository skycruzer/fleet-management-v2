/**
 * Pilot Login API Route
 * POST /api/pilot/login
 *
 * Authenticates a pilot user and returns session data.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogin } from '@/lib/services/pilot-portal-service'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

/**
 * POST /api/pilot/login
 * Authenticate pilot user
 *
 * @body email - Pilot email address
 * @body password - Pilot password
 * @returns 200 with user session or 401/400 with error
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = PilotLoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input. Please check your credentials.',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await pilotLogin(validation.data)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || ERROR_MESSAGES.PORTAL.LOGIN_FAILED.message,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: 'Login successful',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Pilot login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      },
      { status: 500 }
    )
  }
}
