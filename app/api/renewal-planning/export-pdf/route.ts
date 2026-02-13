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
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { generateRenewalPlanPDF } from '@/lib/services/renewal-planning-pdf-service'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
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
        {
          error: 'Invalid year parameter',
          details: 'Year must be a valid number between 2020 and 2100',
        },
        { status: 400 }
      )
    }

    // Get all 13 roster periods for the specified year (full year coverage)
    const { data: periods, error: periodsError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_start_date', `${year}-12-31`)
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

    // Query renewal plans - use lowercase status values that match what the service creates
    // FIX: Service uses 'planned', 'confirmed', 'in_progress', 'completed' (lowercase)
    const renewalsQuery = supabase
      .from('certification_renewal_plans')
      .select(
        `
        *,
        pilot:pilots!certification_renewal_plans_pilot_id_fkey(first_name, last_name, employee_id, role),
        check_type:check_types(check_code, check_description, category)
      `
      )
      .in('planned_roster_period', rosterPeriods)
      .in('status', ['planned', 'confirmed', 'in_progress', 'completed'])

    const { data: renewals, error: renewalsError } = await renewalsQuery

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

    // Filter by checkCodes if specified
    let filteredRenewals = renewals
    if (checkCodes.length > 0) {
      filteredRenewals = renewals.filter((r: any) => checkCodes.includes(r.check_type?.check_code))
    }

    // Validate that we have data after filtering
    if (filteredRenewals.length === 0) {
      return NextResponse.json(
        {
          error: `No renewal plans found for the selected check types`,
          details: `No renewals match the specified check codes: ${checkCodes.join(', ')}`,
          suggestion: 'Try different filter options.',
        },
        { status: 404 }
      )
    }

    // Type assertion for renewals data
    const typedRenewals = filteredRenewals.map((r: any) => ({
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
      pairing_status: r.pairing_status,
      paired_pilot_name: r.paired_pilot_id ? undefined : undefined, // Populated below
      paired_pilot_employee_id: undefined as string | undefined,
    }))

    // Build pairing data for PDF (paired crews + unpaired pilots + statistics)
    const pairedRenewals = filteredRenewals.filter(
      (r: any) => r.pairing_status === 'paired' && r.pair_group_id
    )
    const unpairedRenewals = filteredRenewals.filter(
      (r: any) => r.pairing_status === 'unpaired_solo'
    )

    // Group paired renewals by pair_group_id to form crew pairs
    const pairGroups = new Map<string, any[]>()
    for (const r of pairedRenewals) {
      const groupId = r.pair_group_id as string
      if (!pairGroups.has(groupId)) pairGroups.set(groupId, [])
      pairGroups.get(groupId)!.push(r)
    }

    const pairs: any[] = []
    for (const [groupId, members] of pairGroups) {
      if (members.length >= 2) {
        const captain = members.find((m: any) => m.pilot?.role === 'Captain') || members[0]
        const fo = members.find((m: any) => m.pilot?.role === 'First Officer') || members[1]
        pairs.push({
          id: groupId,
          captain: {
            pilotId: captain.pilot_id,
            renewalPlanId: captain.id,
            name: `${captain.pilot?.first_name || ''} ${captain.pilot?.last_name || ''}`.trim(),
            employeeId: captain.pilot?.employee_id || '',
            expiryDate: captain.original_expiry_date,
            seniorityNumber: 0,
          },
          firstOfficer: {
            pilotId: fo.pilot_id,
            renewalPlanId: fo.id,
            name: `${fo.pilot?.first_name || ''} ${fo.pilot?.last_name || ''}`.trim(),
            employeeId: fo.pilot?.employee_id || '',
            expiryDate: fo.original_expiry_date,
            seniorityNumber: 0,
          },
          category: captain.check_type?.category || 'Flight Checks',
          plannedRosterPeriod: captain.planned_roster_period,
          plannedDate: captain.planned_renewal_date,
          renewalWindowOverlap: { start: '', end: '', days: 0 },
          status: 'paired' as const,
        })
      }
    }

    const unpaired = unpairedRenewals.map((r: any) => ({
      pilotId: r.pilot_id,
      renewalPlanId: r.id,
      name: `${r.pilot?.first_name || ''} ${r.pilot?.last_name || ''}`.trim(),
      employeeId: r.pilot?.employee_id || '',
      role: r.pilot?.role || 'First Officer',
      expiryDate: r.original_expiry_date,
      daysUntilExpiry: Math.ceil(
        (new Date(r.original_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      category: r.check_type?.category || 'Flight Checks',
      plannedRosterPeriod: r.planned_roster_period,
      plannedDate: r.planned_renewal_date,
      reason: 'no_matching_role' as const,
      status: 'unpaired_solo' as const,
      urgency: 'normal' as const,
    }))

    const pairingData =
      pairs.length > 0 || unpaired.length > 0
        ? {
            pairs,
            unpaired,
            statistics: {
              totalPairs: pairs.length,
              totalUnpaired: unpaired.length,
              byCategory: [] as any[],
              urgentUnpaired: unpaired.filter((u) => u.daysUntilExpiry < 30).length,
              averageOverlapDays: 0,
              rhsCheckCount: 0,
              captainRoleBreakdown: {
                lineCaptains: 0,
                trainingCaptains: 0,
                examiners: 0,
                rhsCaptains: 0,
              },
            },
          }
        : undefined

    // Generate PDF
    const pdfBlob = await generateRenewalPlanPDF({
      year: year,
      summaries: validSummaries,
      renewals: typedRenewals,
      generatedAt: new Date(),
      pairingData,
    })

    // Convert blob to buffer for Response
    const buffer = await pdfBlob.arrayBuffer()

    // Build filename with filter info
    const filterPart = checkCodes.length > 0 ? `_${checkCodes.join('_')}` : ''
    const filename = `Renewal_Plan_${year}${filterPart}.pdf`

    // Return PDF as download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
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
