/**
 * API Route: Confirm Renewal Plan
 * PUT /api/renewal-planning/:planId/confirm
 *
 * Confirms a planned renewal (moves status from 'planned' to 'confirmed')
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { confirmRenewalPlan } from '@/lib/services/certification-renewal-planning-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const PUT = createAdminRoute(
  {
    operation: 'confirmRenewalPlan',
    endpoint: '/api/renewal-planning/[planId]/confirm',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params }) => {
    try {
      const { planId } = params
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
      const { planId } = params
      const sanitized = sanitizeError(error, {
        operation: 'confirmRenewalPlan',
        resourceId: planId,
        endpoint: '/api/renewal-planning/[planId]/confirm',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
