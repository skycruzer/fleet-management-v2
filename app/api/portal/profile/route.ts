import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/portal/profile
 * Fetch pilot personal information for the authenticated pilot
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - pilot not found',
        },
        { status: 401 }
      )
    }

    // Get requirements first
    const requirements = await getPilotRequirements()

    // Check if pilot has a linked pilots table record
    if (pilot.pilot_id) {
      // Fetch full pilot details from pilots table
      const { data: pilotData, error: pilotError } = await supabase
        .from('pilots')
        .select('*')
        .eq('id', pilot.pilot_id)
        .single()

      if (pilotError) {
        console.error('Fetch pilot details error:', pilotError)
        // Fall back to pilot_users data
        return NextResponse.json({
          success: true,
          data: {
            id: pilot.id,
            first_name: pilot.first_name,
            last_name: pilot.last_name,
            rank: pilot.rank,
            email: pilot.email,
            employee_id: pilot.employee_id,
            seniority_number: null,
            date_of_birth: null,
            commencement_date: null,
            status: 'active',
            phone_number: null,
            address: null,
          },
          systemSettings: {
            pilot_retirement_age: requirements.pilot_retirement_age,
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...pilotData,
          email: pilot.email,
        },
        systemSettings: {
          pilot_retirement_age: requirements.pilot_retirement_age,
        },
      })
    } else {
      // Pilot only exists in pilot_users table (no linked pilots record)
      // Return data from pilot_users
      return NextResponse.json({
        success: true,
        data: {
          id: pilot.id,
          first_name: pilot.first_name,
          last_name: pilot.last_name,
          rank: pilot.rank,
          email: pilot.email,
          employee_id: pilot.employee_id,
          seniority_number: null,
          date_of_birth: null,
          commencement_date: null,
          status: 'active',
          phone_number: null,
          address: null,
        },
        systemSettings: {
          pilot_retirement_age: requirements.pilot_retirement_age,
        },
      })
    }
  } catch (error: any) {
    console.error('Profile API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPilotProfile',
      endpoint: '/api/portal/profile',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
