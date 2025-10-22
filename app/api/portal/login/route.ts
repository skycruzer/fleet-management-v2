/**
 * Pilot Portal Login API Route
 *
 * POST /api/portal/login - Authenticate pilot and create session
 *
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogin } from '@/lib/services/pilot-portal-service'
import { PilotLoginSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

export async function POST(_request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await _request.json()
    const validation = PilotLoginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: validation.error.issues[0].message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('credentials').category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('credentials').severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Authenticate pilot
    const result = await pilotLogin(validation.data)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.LOGIN_FAILED, 401), {
        status: 401,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: result.data?.user,
        // Session is managed via httpOnly cookies by Supabase
      },
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
