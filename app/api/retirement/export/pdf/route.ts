/**
 * Retirement Forecast PDF Export API Route
 * Generates PDF report with retirement forecast data
 *
 * @route GET /api/retirement/export/pdf
 * @version 1.0.0
 * @since 2025-10-25
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { generateRetirementForecastPDF } from '@/lib/services/retirement-forecast-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { NextResponse } from 'next/server'

/**
 * GET /api/retirement/export/pdf
 * Generates and downloads retirement forecast PDF report
 *
 * @returns PDF file as download
 */
export const GET = createAdminRoute(
  {
    operation: 'exportRetirementForecastPDF',
    endpoint: '/api/retirement/export/pdf',
    rateLimit: false,
  },
  async ({ admin }) => {
    try {
      // Get user role
      const supabase = createAdminClient()
      const { data: userData, error: userError } = await supabase
        .from('an_users')
        .select('role')
        .eq('id', admin.userId)
        .single()

      if (userError || !userData) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }

      // Only Admin and Manager can export PDFs (an_users.role is lowercase)
      if (!['admin', 'manager'].includes(userData.role?.toLowerCase())) {
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
)
