/**
 * PDF Export API Route
 * Generates PDF report for certification renewal planning
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
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Get all roster periods - show current period and next 13 periods (full annual cycle)
    const today = new Date().toISOString().split('T')[0]

    const { data: periods } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date')
      .gte('period_start_date', today)
      .order('period_start_date')
      .limit(13)

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { error: `No roster periods found for year ${year}` },
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

    // Get all renewals for the fetched roster periods
    const rosterPeriods = periods.map((p) => p.roster_period)

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
      .in('status', ['confirmed', 'pending'])

    if (renewalsError) {
      console.error('Error fetching renewals:', renewalsError)
      return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 })
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

    // Generate PDF
    const pdfBlob = await generateRenewalPlanPDF({
      year: parseInt(year),
      summaries: validSummaries,
      renewals: typedRenewals,
      generatedAt: new Date(),
    })

    // Convert blob to buffer for Response
    const buffer = await pdfBlob.arrayBuffer()

    // Return PDF as download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Renewal_Plan_${year}.pdf"`)

    return new Response(buffer, { headers })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
