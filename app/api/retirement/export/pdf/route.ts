/**
 * Retirement Forecast PDF Export API Route
 * Generates PDF report with retirement forecast data
 *
 * @route GET /api/retirement/export/pdf
 * @version 1.0.0
 * @since 2025-10-25
 */

import { generateRetirementForecastPDF } from '@/lib/services/retirement-forecast-service'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/retirement/export/pdf
 * Generates and downloads retirement forecast PDF report
 *
 * @returns PDF file as download
 */
export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Only Admin and Manager can export PDFs
    if (userData.role !== 'Admin' && userData.role !== 'Manager') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Default retirement age (could be fetched from system settings)
    const retirementAge = 65

    // Generate PDF
    const pdfBuffer = await generateRetirementForecastPDF(retirementAge)

    // Return PDF as download - Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="retirement-forecast-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 })
  }
}
