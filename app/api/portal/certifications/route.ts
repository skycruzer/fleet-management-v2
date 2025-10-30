import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'

/**
 * GET /api/portal/certifications
 * Fetch all certifications for the authenticated pilot
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

    const pilotUser = pilot

    // If pilot doesn't have a linked pilots table record, return empty certifications
    if (!pilotUser.pilot_id) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No pilot record linked - certifications not available',
      })
    }

    // Fetch pilot certifications with check types
    const { data: certifications, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        *,
        check_types (
          check_code,
          check_description,
          category
        )
      `
      )
      .eq('pilot_id', pilotUser.pilot_id)
      .order('expiry_date', { ascending: false })

    if (error) {
      console.error('Fetch certifications error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch certifications',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: certifications || [],
    })
  } catch (error) {
    console.error('Certifications API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
