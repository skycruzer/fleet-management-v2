import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot } from '@/lib/services/pilot-portal-service'

/**
 * GET /api/portal/certifications
 * Fetch all certifications for the authenticated pilot
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
      .eq('pilot_id', pilotUser.pilot_id || pilotUser.id)
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
