/**
 * Pilot Portal Session API
 *
 * GET /api/portal/session
 * Returns current pilot session information
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextResponse } from 'next/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'

export async function GET() {
  try {
    const pilot = await getCurrentPilot()

    if (!pilot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated or not approved',
        },
        { status: 401 }
      )
    }

    // Return pilot session data needed for forms
    return NextResponse.json({
      success: true,
      data: {
        id: pilot.id,
        pilot_id: pilot.pilot_id || pilot.id, // Use pilot_id from pilots table if linked
        employee_id: pilot.employee_id,
        email: pilot.email,
        first_name: pilot.first_name,
        last_name: pilot.last_name,
        rank: pilot.rank,
        auth_user_id: pilot.auth_user_id,
      },
    })
  } catch (error) {
    console.error('Error getting pilot session:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
