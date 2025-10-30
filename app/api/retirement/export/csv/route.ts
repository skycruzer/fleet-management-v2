/**
 * Retirement Forecast CSV Export API Route
 * Generates CSV file with retirement forecast data
 *
 * @route GET /api/retirement/export/csv
 * @version 1.0.0
 * @since 2025-10-25
 */

import { generateRetirementForecastCSV } from '@/lib/services/retirement-forecast-service'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/retirement/export/csv
 * Generates and downloads retirement forecast CSV file
 *
 * @returns CSV file as download
 */
export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Only Admin and Manager can export CSVs
    if (userData.role !== 'Admin' && userData.role !== 'Manager') {
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
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}
