/**
 * Pilot Registration API Route
 * POST /api/pilot/register
 *
 * Submits a new pilot registration request for admin approval.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitPilotRegistration } from '@/lib/services/pilot-portal-service'
import { PilotRegistrationSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { handleConstraintError } from '@/lib/utils/constraint-error-handler'

/**
 * POST /api/pilot/register
 * Submit pilot registration request
 *
 * @body email - Pilot email address
 * @body password - Pilot password
 * @body first_name - Pilot first name
 * @body last_name - Pilot last name
 * @body rank - Pilot rank (Captain or First Officer)
 * @body employee_id - Optional Air Niugini employee number
 * @body date_of_birth - Optional date of birth
 * @body phone_number - Optional phone number
 * @body address - Optional address
 * @returns 201 with registration ID or 400/409/500 with error
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = PilotRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input. Please check your request.',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    // Attempt registration
    const result = await submitPilotRegistration(validation.data)

    if (!result.success) {
      // Check for duplicate email or employee ID
      const statusCode = result.error?.includes('already') ? 409 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error || ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message:
          'Registration submitted successfully. Please wait for admin approval before logging in.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Pilot registration error:', error)

    // Handle constraint errors (duplicate email/employee_id)
    const errorMessage = handleConstraintError(error)
    if (errorMessage !== 'An error occurred. Please try again.') {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.NETWORK.SERVER_ERROR.message,
      },
      { status: 500 }
    )
  }
}
