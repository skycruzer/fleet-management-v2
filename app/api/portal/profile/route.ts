import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from '@/lib/services/pilot-portal-service'

/**
 * GET /api/portal/profile
 * Fetch pilot personal information for the authenticated pilot
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current pilot
    const pilotResult = await getCurrentPilot()
    if (!pilotResult.success || !pilotResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - pilot not found',
        },
        { status: 401 }
      )
    }

    const pilotUser = pilotResult.data

    // Fetch full pilot details from pilots table
    const { data: pilotDetails, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', pilotUser.pilot_id || pilotUser.id)
      .single()

    if (error) {
      console.error('Fetch pilot details error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch pilot details',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pilotDetails,
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
