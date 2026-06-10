/**
 * API Route: Reschedule Renewal Plan
 * PUT /api/renewal-planning/:planId/reschedule
 *
 * Updates the planned renewal date for a certification
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { updatePlannedRenewalDate } from '@/lib/services/certification-renewal-planning-service'
import { parseISO } from 'date-fns'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const PUT = createAdminRoute(
  {
    operation: 'updatePlannedRenewalDate',
    endpoint: '/api/renewal-planning/[planId]/reschedule',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params }) => {
    try {
      const { planId } = params
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
          pilot: updated.pilot
            ? `${updated.pilot.first_name} ${updated.pilot.last_name}`
            : 'Unknown',
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
      const { planId } = params
      const sanitized = sanitizeError(error, {
        operation: 'updatePlannedRenewalDate',
        resourceId: planId,
        endpoint: '/api/renewal-planning/[planId]/reschedule',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
