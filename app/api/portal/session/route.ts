/**
 * Pilot Portal Session API
 *
 * GET /api/portal/session
 * Returns current pilot session information
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated 2026-06-10 - Migrated to createPilotRoute factory
 */

import { NextResponse } from 'next/server'
import { createPilotRoute } from '@/lib/middleware/create-api-route'

export const GET = createPilotRoute(
  {
    operation: 'getPilotSession',
    endpoint: '/api/portal/session',
    rateLimit: false,
  },
  async ({ pilot }) => {
    try {
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
)
