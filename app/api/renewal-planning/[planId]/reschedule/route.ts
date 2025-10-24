/**
 * API Route: Reschedule Renewal Plan
 * PUT /api/renewal-planning/:planId/reschedule
 *
 * Updates the planned renewal date for a certification
 */

import { NextRequest, NextResponse } from 'next/server'
import { updatePlannedRenewalDate } from '@/lib/services/certification-renewal-planning-service'
import { parseISO } from 'date-fns'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reschedule renewal plan',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
