/**
 * API Route: Get Pilot Renewal Plan
 * GET /api/renewal-planning/pilot/:pilotId
 *
 * Returns renewal schedule for a specific pilot
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getPilotRenewalPlan } from '@/lib/services/certification-renewal-planning-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const GET = createAdminRoute(
  {
    operation: 'getPilotRenewalPlan',
    endpoint: '/api/renewal-planning/pilot/[pilotId]',
    rateLimit: false,
  },
  async ({ params }) => {
    try {
      const { pilotId } = params

      const renewals = await getPilotRenewalPlan(pilotId)

      if (renewals.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            pilotId,
            renewals: [],
          },
          message: 'No renewal plans found for this pilot',
        })
      }

      const pilot = renewals[0].pilot

      return NextResponse.json({
        success: true,
        data: {
          pilotId,
          pilotName: pilot ? `${pilot.first_name} ${pilot.last_name}` : 'Unknown',
          employeeId: pilot?.employee_id,
          role: pilot?.role,
          renewals: renewals.map((r) => ({
            id: r.id,
            checkType: r.check_type?.check_description,
            checkCode: r.check_type?.check_code,
            category: r.check_type?.category,
            originalExpiry: r.original_expiry_date,
            plannedRenewal: r.planned_renewal_date,
            rosterPeriod: r.planned_roster_period,
            renewalWindow: {
              start: r.renewal_window_start,
              end: r.renewal_window_end,
            },
            pairedWith: r.paired_pilot
              ? `${r.paired_pilot.first_name} ${r.paired_pilot.last_name}`
              : null,
            status: r.status,
            priority: r.priority,
            notes: r.notes,
          })),
        },
      })
    } catch (error: any) {
      console.error('Error fetching pilot renewal plan:', error)
      const { pilotId } = params
      const sanitized = sanitizeError(error, {
        operation: 'getPilotRenewalPlan',
        resourceId: pilotId,
        endpoint: '/api/renewal-planning/pilot/[pilotId]',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
