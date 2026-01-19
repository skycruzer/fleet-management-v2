/**
 * CSV Export API Route for Certification Renewal Planning
 *
 * Generates CSV export of renewal plans with pairing information.
 * Includes Captain/FO pairing status for Flight and Simulator checks.
 */

import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { formatDate } from '@/lib/utils/date-utils'

export const dynamic = 'force-dynamic'

interface RenewalRow {
  pilot_name: string
  employee_id: string
  role: string
  category: string
  check_code: string
  check_description: string
  roster_period: string
  planned_date: string
  expiry_date: string
  status: string
  pairing_status: string
  paired_with: string
  paired_employee_id: string
}

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const categoryFilter = searchParams.get('category') // Optional category filter
    const checkCodesParam = searchParams.get('checkCodes') // Optional check codes filter (comma-separated)
    const checkCodes = checkCodesParam ? checkCodesParam.split(',').filter(Boolean) : []

    // Validate year parameter
    if (!yearParam) {
      return NextResponse.json(
        {
          error: 'Year parameter is required',
          details: 'Please specify a year (e.g., ?year=2025)',
        },
        { status: 400 }
      )
    }

    const year = parseInt(yearParam, 10)
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year parameter', details: 'Year must be between 2020 and 2100' },
        { status: 400 }
      )
    }

    // Get all 13 roster periods for the specified year (full year coverage)
    const { data: periods, error: periodsError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_start_date', `${year}-12-31`)
      .order('period_start_date')

    if (periodsError) {
      console.error('[CSV Export] Error fetching periods:', periodsError)
      return NextResponse.json(
        { error: 'Failed to fetch roster periods', details: periodsError.message },
        { status: 500 }
      )
    }

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { error: `No roster periods found for year ${year}` },
        { status: 404 }
      )
    }

    const rosterPeriods = periods.map((p) => p.roster_period)

    // Build query for renewal plans with pairing info
    const query = supabase
      .from('certification_renewal_plans')
      .select(
        `
        id,
        planned_renewal_date,
        original_expiry_date,
        planned_roster_period,
        status,
        pairing_status,
        paired_pilot_id,
        pair_group_id,
        pilot:pilots!certification_renewal_plans_pilot_id_fkey(
          first_name,
          last_name,
          employee_id,
          role
        ),
        check_type:check_types(
          check_code,
          check_description,
          category
        ),
        paired_pilot:pilots!certification_renewal_plans_paired_pilot_id_fkey(
          first_name,
          last_name,
          employee_id,
          role
        )
      `
      )
      .in('planned_roster_period', rosterPeriods)
      .in('status', ['planned', 'confirmed', 'in_progress', 'completed'])
      .order('planned_roster_period')

    const { data: renewals, error: renewalsError } = await query

    if (renewalsError) {
      console.error('[CSV Export] Error fetching renewals:', renewalsError)
      return NextResponse.json(
        { error: 'Failed to fetch renewal plans', details: renewalsError.message },
        { status: 500 }
      )
    }

    if (!renewals || renewals.length === 0) {
      return NextResponse.json(
        {
          error: `No renewal plans found for year ${year}`,
          details: 'Generate a renewal plan first.',
        },
        { status: 404 }
      )
    }

    // Filter by checkCodes (takes priority) or category
    let filteredRenewals = renewals
    if (checkCodes.length > 0) {
      // Filter by specific check codes (e.g., B767_COMP, B767_IRR)
      filteredRenewals = renewals.filter((r: any) => checkCodes.includes(r.check_type?.check_code))
    } else if (categoryFilter) {
      // Fall back to category filter
      filteredRenewals = renewals.filter((r: any) => r.check_type?.category === categoryFilter)
    }

    // Transform to CSV rows
    const csvRows: RenewalRow[] = filteredRenewals.map((r: any) => {
      const pilotName = r.pilot ? `${r.pilot.first_name} ${r.pilot.last_name}` : 'Unknown'
      const pairedName = r.paired_pilot
        ? `${r.paired_pilot.first_name} ${r.paired_pilot.last_name}`
        : ''

      return {
        pilot_name: pilotName,
        employee_id: r.pilot?.employee_id || '',
        role: r.pilot?.role || '',
        category: r.check_type?.category || '',
        check_code: r.check_type?.check_code || '',
        check_description: r.check_type?.check_description || '',
        roster_period: r.planned_roster_period || '',
        planned_date: r.planned_renewal_date ? formatDate(new Date(r.planned_renewal_date)) : '',
        expiry_date: r.original_expiry_date ? formatDate(new Date(r.original_expiry_date)) : '',
        status: r.status || '',
        pairing_status: r.pairing_status || 'not_applicable',
        paired_with: pairedName,
        paired_employee_id: r.paired_pilot?.employee_id || '',
      }
    })

    // Sort by roster period, then by category, then by pilot name
    csvRows.sort((a, b) => {
      const periodCompare = a.roster_period.localeCompare(b.roster_period)
      if (periodCompare !== 0) return periodCompare
      const categoryCompare = a.category.localeCompare(b.category)
      if (categoryCompare !== 0) return categoryCompare
      return a.pilot_name.localeCompare(b.pilot_name)
    })

    // Generate CSV content
    const headers = [
      'Pilot Name',
      'Employee ID',
      'Role',
      'Category',
      'Check Code',
      'Check Description',
      'Roster Period',
      'Planned Date',
      'Expiry Date',
      'Status',
      'Pairing Status',
      'Paired With',
      'Paired Employee ID',
    ]

    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) =>
        [
          escapeCSV(row.pilot_name),
          escapeCSV(row.employee_id),
          escapeCSV(row.role),
          escapeCSV(row.category),
          escapeCSV(row.check_code),
          escapeCSV(row.check_description),
          escapeCSV(row.roster_period),
          escapeCSV(row.planned_date),
          escapeCSV(row.expiry_date),
          escapeCSV(row.status),
          escapeCSV(row.pairing_status),
          escapeCSV(row.paired_with),
          escapeCSV(row.paired_employee_id),
        ].join(',')
      ),
    ].join('\n')

    // Build filename with filter info
    let filterPart = ''
    if (checkCodes.length > 0) {
      filterPart = `_${checkCodes.join('_')}`
    } else if (categoryFilter) {
      filterPart = `_${categoryFilter.replace(/\s+/g, '_')}`
    }
    const filename = `Renewal_Plan_${year}${filterPart}.csv`

    // Return CSV as download
    const headers_ = new Headers()
    headers_.set('Content-Type', 'text/csv; charset=utf-8')
    headers_.set('Content-Disposition', `attachment; filename="${filename}"`)

    return new Response(csvContent, {
      status: 200,
      headers: headers_,
    })
  } catch (error) {
    console.error('[CSV Export] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate CSV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return ''
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
