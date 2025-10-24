/**
 * API Route: Confirm Renewal Plan
 * PUT /api/renewal-planning/:planId/confirm
 *
 * Confirms a planned renewal (moves status from 'planned' to 'confirmed')
 */

import { NextRequest, NextResponse } from 'next/server'
import { confirmRenewalPlan } from '@/lib/services/certification-renewal-planning-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm renewal plan',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
