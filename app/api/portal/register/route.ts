/**
 * Pilot Portal Registration API Route
 *
 * POST /api/portal/register - Submit pilot registration for approval
 * GET /api/portal/register?email=... - Check registration status
 *
 * @spec 001-missing-core-features (US1, US8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitPilotRegistration, getRegistrationStatus } from '@/lib/services/pilot-portal-service'
import { PilotRegistrationSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

/**
 * POST - Submit new pilot registration
 */
export async function POST(_request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await _request.json()
    const validation = PilotRegistrationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        formatApiError(
          {
            message: firstError.message,
            category: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT(firstError.path[0] as string)
              .category,
            severity: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT(firstError.path[0] as string)
              .severity,
          },
          400
        ),
        { status: 400 }
      )
    }

    // Submit registration
    const result = await submitPilotRegistration(validation.data)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED, 400), {
        status: 400,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Registration submitted successfully. Awaiting admin approval.',
    })
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * GET - Check registration status by email
 */
export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('email'), 400),
        { status: 400 }
      )
    }

    // Get registration status
    const result = await getRegistrationStatus(email)

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch registration status',
            category: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registration').category,
            severity: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registration').severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No registration found for this email',
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get registration status API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
