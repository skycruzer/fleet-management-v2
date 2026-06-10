/**
 * Retirement Forecast CSV Export API Route
 * Generates CSV file with retirement forecast data
 *
 * @route GET /api/retirement/export/csv
 * @version 1.0.0
 * @since 2025-10-25
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { generateRetirementForecastCSV } from '@/lib/services/retirement-forecast-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { NextResponse } from 'next/server'

/**
 * GET /api/retirement/export/csv
 * Generates and downloads retirement forecast CSV file
 *
 * @returns CSV file as download
 */
export const GET = createAdminRoute(
  {
    operation: 'exportRetirementForecastCSV',
    endpoint: '/api/retirement/export/csv',
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

      // Only Admin and Manager can export CSVs (an_users.role is lowercase)
      if (!['admin', 'manager'].includes(userData.role?.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Default retirement age (could be fetched from system settings)
      const retirementAge = 65

      // Generate CSV
      const csvContent = await generateRetirementForecastCSV(retirementAge)

      // Return CSV as download
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8;',
          'Content-Disposition': `attachment; filename="retirement-forecast-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (error) {
      console.error('CSV export error:', error)
      return NextResponse.json({ success: false, error: 'Failed to generate CSV' }, { status: 500 })
    }
  }
)
