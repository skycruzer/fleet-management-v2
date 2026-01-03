/**
 * API Route: Confirm Renewal Plan
 * PUT /api/renewal-planning/:planId/confirm
 *
 * Confirms a planned renewal (moves status from 'planned' to 'confirmed')
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { confirmRenewalPlan } from '@/lib/services/certification-renewal-planning-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { planId } = await params
    const body = await request.json()
    const { userId } = body

    const confirmed = await confirmRenewalPlan(planId, userId)

    return NextResponse.json({
      success: true,
      data: {
        id: confirmed.id,
        pilot: confirmed.pilot
          ? `${confirmed.pilot.first_name} ${confirmed.pilot.last_name}`
          : 'Unknown',
        checkType: confirmed.check_type?.check_description,
        plannedDate: confirmed.planned_renewal_date,
        rosterPeriod: confirmed.planned_roster_period,
        status: confirmed.status,
      },
      message: 'Renewal plan confirmed successfully',
    })
  } catch (error: any) {
    console.error('Error confirming renewal plan:', error)
    const { planId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'confirmRenewalPlan',
      resourceId: planId,
      endpoint: '/api/renewal-planning/[planId]/confirm',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
