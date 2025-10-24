/**
 * API Route: Export Renewal Plans to CSV
 * GET /api/renewal-planning/export?year=2026
 *
 * Exports renewal plans to a CSV file for download
 * Supports optional year filtering
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    // Build query with optional year filter
    let query = supabase
      .from('certification_renewal_plans')
      .select(
        `
        *,
        pilots:pilot_id (
          id,
          first_name,
          last_name,
          employee_id,
          role,
          seniority_number
        ),
        check_types:check_type_id (
          id,
          check_code,
          check_description,
          category
        ),
        paired_pilot:paired_pilot_id (
          id,
          first_name,
          last_name
        )
      `
      )
      .order('planned_roster_period')
      .order('planned_renewal_date')

    // Filter by year if provided
    if (year) {
      query = query.like('planned_roster_period', `%${year}%`)
    }

    const { data: renewals, error } = await query

    if (error) throw error

    // Generate CSV headers
    const headers = [
      'Roster Period',
      'Pilot Name',
      'Employee ID',
      'Role',
      'Seniority',
      'Check Code',
      'Check Description',
      'Category',
      'Original Expiry',
      'Planned Renewal',
      'Renewal Window Start',
      'Renewal Window End',
      'Status',
      'Priority',
      'Paired With',
      'Notes',
    ]

    // Generate CSV rows
    const rows = renewals?.map((renewal: any) => {
      return [
        renewal.planned_roster_period || '',
        renewal.pilots ? `${renewal.pilots.first_name} ${renewal.pilots.last_name}` : '',
        renewal.pilots?.employee_id || '',
        renewal.pilots?.role || '',
        renewal.pilots?.seniority_number || '',
        renewal.check_types?.check_code || '',
        renewal.check_types?.check_description || '',
        renewal.check_types?.category || '',
        renewal.original_expiry_date || '',
        renewal.planned_renewal_date || '',
        renewal.renewal_window_start || '',
        renewal.renewal_window_end || '',
        renewal.status || '',
        renewal.priority || '',
        renewal.paired_pilot
          ? `${renewal.paired_pilot.first_name} ${renewal.paired_pilot.last_name}`
          : '',
        renewal.notes || '',
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...(rows || []).map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Return CSV file with year in filename
    const filename = year
      ? `renewal-plans-${year}.csv`
      : `renewal-plans-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting renewal plans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export renewal plans',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
