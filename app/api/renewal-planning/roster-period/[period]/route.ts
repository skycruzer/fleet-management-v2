/**
 * API Route: Get Roster Period Renewals
 * GET /api/renewal-planning/roster-period/:period
 *
 * Returns all renewals planned for a specific roster period
 */

import { NextResponse } from 'next/server'
import {
  getRenewalsByRosterPeriod,
  getRosterPeriodCapacity,
} from '@/lib/services/certification-renewal-planning-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const GET = createAdminRoute(
  {
    operation: 'getRosterPeriodRenewals',
    endpoint: '/api/renewal-planning/roster-period/[period]',
    rateLimit: false,
  },
  async ({ params }) => {
    try {
      const period = params.period

      // Get capacity summary
      const summary = await getRosterPeriodCapacity(period)

      if (!summary) {
        return NextResponse.json(
          {
            success: false,
            error: 'Roster period not found',
          },
          { status: 404 }
        )
      }

      // Get renewals
      const renewals = await getRenewalsByRosterPeriod(period)

      return NextResponse.json({
        success: true,
        data: {
          rosterPeriod: summary.rosterPeriod,
          periodDates: {
            start: summary.periodStartDate.toISOString().split('T')[0],
            end: summary.periodEndDate.toISOString().split('T')[0],
          },
          categoryBreakdown: summary.categoryBreakdown,
          totalPlannedRenewals: summary.totalPlannedRenewals,
          totalCapacity: summary.totalCapacity,
          utilizationPercentage: Math.round(summary.utilizationPercentage),
          renewals: renewals.map((r) => ({
            id: r.id,
            pilot: r.pilot
              ? {
                  id: r.pilot.id,
                  name: `${r.pilot.first_name} ${r.pilot.last_name}`,
                  employeeId: r.pilot.employee_id,
                  role: r.pilot.role,
                }
              : null,
            checkType: r.check_type
              ? {
                  code: r.check_type.check_code,
                  description: r.check_type.check_description,
                  category: r.check_type.category,
                }
              : null,
            plannedDate: r.planned_renewal_date,
            expiryDate: r.original_expiry_date,
            status: r.status,
            priority: r.priority,
            pairedWith: r.paired_pilot
              ? `${r.paired_pilot.first_name} ${r.paired_pilot.last_name}`
              : null,
          })),
        },
      })
    } catch (error) {
      console.error('Error fetching roster period renewals:', error)
      const sanitized = sanitizeError(error, {
        operation: 'getRosterPeriodRenewals',
        endpoint: '/api/renewal-planning/roster-period/[period]',
      })
      return NextResponse.json(
        { success: false, ...sanitized },
        { status: sanitized.statusCode || 500 }
      )
    }
  }
)
