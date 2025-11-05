/**
 * API Route: Reschedule Renewal Plan
 * PUT /api/renewal-planning/:planId/reschedule
 *
 * Updates the planned renewal date for a certification
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { updatePlannedRenewalDate } from '@/lib/services/certification-renewal-planning-service'
import { parseISO } from 'date-fns'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(user.id)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { planId } = await params
    const body = await request.json()
    const { newDate, reason, userId } = body

    if (!newDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'newDate is required',
        },
        { status: 400 }
      )
    }

    const parsedDate = parseISO(newDate)
    const updated = await updatePlannedRenewalDate(
      planId,
      parsedDate,
      reason || 'Rescheduled via API',
      userId
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        pilot: updated.pilot ? `${updated.pilot.first_name} ${updated.pilot.last_name}` : 'Unknown',
        checkType: updated.check_type?.check_description,
        previousDate: body.previousDate,
        newDate: updated.planned_renewal_date,
        newRosterPeriod: updated.planned_roster_period,
        status: updated.status,
      },
      message: 'Renewal plan rescheduled successfully',
    })
  } catch (error: any) {
    console.error('Error rescheduling renewal plan:', error)
    const { planId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'updatePlannedRenewalDate',
      resourceId: planId,
      endpoint: '/api/renewal-planning/[planId]/reschedule'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
