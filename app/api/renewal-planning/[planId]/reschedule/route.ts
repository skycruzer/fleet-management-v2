/**
 * API Route: Reschedule Renewal Plan
 * PUT /api/renewal-planning/:planId/reschedule
 *
 * Updates the planned renewal date for a certification
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { updatePlannedRenewalDate } from '@/lib/services/certification-renewal-planning-service'
import { invalidateRenewalPlanningCaches } from '@/lib/services/cache-invalidation-helper'
import { parseISO, isValid } from 'date-fns'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

// Note: `userId`/`changed_by` is intentionally NOT accepted from the client body —
// trusting a client-supplied actor id would let any caller spoof
// `renewal_plan_history.changed_by`. The actor is always derived from the
// authenticated admin session (see `admin.userId` below).
const RescheduleSchema = z.object({
  newDate: z.string().refine((val) => isValid(parseISO(val)), {
    message: 'newDate must be a valid ISO date (e.g. YYYY-MM-DD)',
  }),
  reason: z.string().trim().min(1).max(500).optional(),
  previousDate: z.string().optional(),
})

export const PUT = createAdminRoute(
  {
    operation: 'updatePlannedRenewalDate',
    endpoint: '/api/renewal-planning/[planId]/reschedule',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    schema: RescheduleSchema,
  },
  async ({ params, body, admin }) => {
    const { planId } = params
    try {
      const { newDate, reason, previousDate } = body

      const parsedDate = parseISO(newDate)
      const updated = await updatePlannedRenewalDate(
        planId,
        parsedDate,
        reason || 'Rescheduled via API',
        admin.userId
      )

      await invalidateRenewalPlanningCaches().catch((cacheError) =>
        console.error('Cache invalidation failed (non-blocking):', cacheError)
      )

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          pilot: updated.pilot
            ? `${updated.pilot.first_name} ${updated.pilot.last_name}`
            : 'Unknown',
          checkType: updated.check_type?.check_description,
          previousDate,
          newDate: updated.planned_renewal_date,
          newRosterPeriod: updated.planned_roster_period,
          status: updated.status,
        },
        message: 'Renewal plan rescheduled successfully',
      })
    } catch (error) {
      console.error('Error rescheduling renewal plan:', error)
      const sanitized = sanitizeError(error, {
        operation: 'updatePlannedRenewalDate',
        resourceId: planId,
        endpoint: '/api/renewal-planning/[planId]/reschedule',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
