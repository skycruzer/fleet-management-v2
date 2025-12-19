/**
 * PDF Export API Route
 * Generates PDF report for certification renewal planning
 *
 * FIXES APPLIED:
 * - Fixed year parameter filtering (was using 'today', now uses year)
 * - Added 'planned' status to renewal queries
 * - Added validation for empty data before PDF generation
 * - Enhanced error messages with user-friendly responses
 * - Added comprehensive logging
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRenewalPlanPDF } from '@/lib/services/renewal-planning-pdf-service'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')

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
        {
          error: 'Invalid year parameter',
          details: 'Year must be a valid number between 2020 and 2100',
        },
        { status: 400 }
      )
    }

    // FIX #1: Get roster periods for the SPECIFIED YEAR (not 'today')
    // Query roster periods that fall within the specified year (February - November)
    const { data: periods, error: periodsError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .gte('period_start_date', `${year}-02-01`) // Start from February of specified year
      .lte('period_start_date', `${year}-11-30`) // End in November of specified year
      .order('period_start_date')

    if (periodsError) {
      console.error('Error fetching roster periods:', periodsError)
      return NextResponse.json(
        {
          error: 'Failed to fetch roster periods',
          details: periodsError.message || 'Database query error',
        },
        { status: 500 }
      )
    }

    // FIX #3: Validate that we have data before proceeding
    if (!periods || periods.length === 0) {
      return NextResponse.json(
        {
          error: `No roster periods found for year ${year}`,
          details: `No roster periods are available for ${year}. Please ensure roster periods have been generated for this year.`,
          suggestion: 'Try a different year or generate roster periods first.',
        },
        { status: 404 }
      )
    }

    console.log(
      `[PDF Export] Found ${periods.length} roster periods for year ${year} (${periods[0].roster_period} - ${periods[periods.length - 1].roster_period})`
    )

    // Get capacity summaries for each period
    const summaries = await Promise.all(
      periods.map(async (p) => {
        const summary = await getRosterPeriodCapacity(p.roster_period)
        return summary
      })
    )

    const validSummaries = summaries.filter((s) => s !== null)

    if (validSummaries.length === 0) {
      return NextResponse.json(
        {
          error: 'No capacity data available',
          details: `Roster periods exist for ${year}, but capacity data could not be retrieved.`,
          suggestion: 'Please contact system administrator.',
        },
        { status: 500 }
      )
    }

    // Get all renewals for the fetched roster periods
    const rosterPeriods = periods.map((p) => p.roster_period)

    // Query renewal plans - use uppercase status values to match database constraint
    const { data: renewals, error: renewalsError } = await supabase
      .from('certification_renewal_plans')
      .select(
        `
        *,
        pilot:pilots!certification_renewal_plans_pilot_id_fkey(first_name, last_name, employee_id, role),
        check_type:check_types(check_code, check_description, category)
      `
      )
      .in('planned_roster_period', rosterPeriods)
      .in('status', ['PENDING', 'SCHEDULED', 'COMPLETED']) // Match database constraint values

    if (renewalsError) {
      console.error('Error fetching renewals:', renewalsError)
      return NextResponse.json(
        {
          error: 'Failed to fetch renewal plans',
          details: renewalsError.message || 'Database query error',
        },
        { status: 500 }
      )
    }

    console.log(
      `[PDF Export] Found ${renewals?.length || 0} renewals for roster periods: ${rosterPeriods.join(', ')}`
    )

    // FIX #3: Validate that we have renewal data
    if (!renewals || renewals.length === 0) {
      return NextResponse.json(
        {
          error: `No renewal plans found for year ${year}`,
          details: `Roster periods exist for ${year}, but no renewal plans have been created yet.`,
          suggestion: 'Generate a renewal plan for this year first.',
        },
        { status: 404 }
      )
    }

    // Type assertion for renewals data
    const typedRenewals = (renewals || []).map((r: any) => ({
      id: r.id,
      pilot: {
        first_name: r.pilot?.first_name || '',
        last_name: r.pilot?.last_name || '',
        employee_id: r.pilot?.employee_id || '',
        rank: r.pilot?.role,
      },
      check_type: {
        check_code: r.check_type?.check_code || '',
        check_description: r.check_type?.check_description || '',
        category: r.check_type?.category || '',
      },
      planned_renewal_date: r.planned_renewal_date || '',
      original_expiry_date: r.original_expiry_date || '',
      roster_period: r.planned_roster_period || '',
      priority: r.priority,
      status: r.status || 'pending',
    }))

    console.log(`[PDF Export] Generating PDF for ${year} with ${typedRenewals.length} renewals...`)

    // Generate PDF
    const pdfBlob = await generateRenewalPlanPDF({
      year: year,
      summaries: validSummaries,
      renewals: typedRenewals,
      generatedAt: new Date(),
    })

    // Convert blob to buffer for Response
    const buffer = await pdfBlob.arrayBuffer()

    console.log(`[PDF Export] PDF generated successfully (${buffer.byteLength} bytes)`)

    // Return PDF as download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Renewal_Plan_${year}.pdf"`)
    headers.set('Content-Length', buffer.byteLength.toString())

    return new Response(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('[PDF Export] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please try again or contact support if the issue persists.',
      },
      { status: 500 }
    )
  }
}
