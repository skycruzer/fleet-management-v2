/**
 * Pilot Registration Approval API Route (Admin Only)
 *
 * GET /api/portal/registration-approval - Get pending registrations
 * POST /api/portal/registration-approval - Approve/deny registration
 *
 * @spec 001-missing-core-features (US8)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingRegistrations,
  reviewPilotRegistration,
} from '@/lib/services/pilot-portal-service'
import { RegistrationApprovalSchema } from '@/lib/validations/pilot-portal-schema'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { createClient } from '@/lib/supabase/server'

/**
 * Verify admin role middleware
 */
async function verifyAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, user: null }
  }

  const { data: userData, error: userError } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== 'admin') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user: userData }
}

/**
 * GET - Get pending registrations (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    // Verify admin
    const { authorized } = await verifyAdmin()
    if (!authorized) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.FORBIDDEN, 403), { status: 403 })
    }

    // Get pending registrations
    const result = await getPendingRegistrations()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Failed to fetch pending registrations',
            category: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registrations').category,
            severity: ERROR_MESSAGES.DATABASE.FETCH_FAILED('registrations').severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get pending registrations API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

/**
 * POST - Approve or deny registration (admin only)
 */
export async function POST(_request: NextRequest) {
  try {
    // Verify admin
    const { authorized, user } = await verifyAdmin()
    if (!authorized || !user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.FORBIDDEN, 403), { status: 403 })
    }

    // Parse and validate request body
    const body = await _request.json()
    const { registrationId, ...approvalData } = body

    if (!registrationId) {
      return NextResponse.json(
        formatApiError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('registrationId'), 400),
        { status: 400 }
      )
    }

    const validation = RegistrationApprovalSchema.safeParse(approvalData)

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

    // Review registration
    const result = await reviewPilotRegistration(registrationId, validation.data, user.id)

    if (!result.success) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PORTAL.APPROVAL_FAILED, 500), {
        status: 500,
      })
    }

    // Send notification to pilot (best effort, don't fail if notification fails)
    // Note: We need pilot_id from the registration to send notification
    // For now, we'll skip notification until we update the service to return pilot_id

    const message =
      validation.data.status === 'APPROVED'
        ? 'Registration approved successfully'
        : 'Registration denied'

    return NextResponse.json({
      success: true,
      data: result.data,
      message,
    })
  } catch (error) {
    console.error('Review registration API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
