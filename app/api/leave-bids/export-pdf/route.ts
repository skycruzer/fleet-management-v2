/**
 * Leave Bid PDF Export API Route
 * Generates PDF report for leave bid management
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLeaveBidsPDF } from '@/lib/services/leave-bids-pdf-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Authentication check - admin only
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const yearParam = searchParams.get('year')

    // Default to next year if not specified
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear() + 1

    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        {
          error: 'Invalid year parameter',
          details: 'Year must be a valid number between 2020 and 2100',
        },
        { status: 400 }
      )
    }

    // Fetch all leave bids with pilot information
    let query = supabase
      .from('leave_bids')
      .select(
        `
        id,
        roster_period_code,
        status,
        created_at,
        updated_at,
        reviewed_at,
        review_comments,
        preferred_dates,
        pilot_id,
        pilots (
          id,
          first_name,
          last_name,
          middle_name,
          employee_id,
          role,
          seniority_number
        ),
        leave_bid_options (
          id,
          priority,
          start_date,
          end_date
        )
      `
      )
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })

    // Apply status filter if specified
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toUpperCase())
    }

    const { data: leaveBids, error } = await query

    if (error) {
      console.error('Error fetching leave bids:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch leave bids',
          details: error.message || 'Database query error',
        },
        { status: 500 }
      )
    }

    if (!leaveBids || leaveBids.length === 0) {
      return NextResponse.json(
        {
          error: `No leave bids found${statusFilter !== 'all' ? ` with status ${statusFilter}` : ''}`,
          details: `No leave bids available for export${yearParam ? ` in year ${year}` : ''}.`,
        },
        { status: 404 }
      )
    }

    // Transform bids: normalize options (portal uses preferred_dates JSON, admin uses leave_bid_options table)
    const bids = leaveBids.map((bid: any) => {
      let options = bid.leave_bid_options || []

      // Portal submissions store dates in preferred_dates JSON
      if (options.length === 0 && bid.preferred_dates) {
        try {
          const parsed =
            typeof bid.preferred_dates === 'string'
              ? JSON.parse(bid.preferred_dates)
              : bid.preferred_dates
          if (Array.isArray(parsed)) {
            options = parsed.map((item: any, index: number) => ({
              id: `${bid.id}-opt-${index}`,
              priority: item.priority || index + 1,
              start_date: item.start_date,
              end_date: item.end_date,
            }))
          }
        } catch {
          // Invalid JSON — leave options empty
        }
      }

      // Enrich each option with roster period codes
      const enrichedOptions = options.map((opt: any) => {
        let roster_periods: string[] = []
        if (opt.start_date && opt.end_date) {
          try {
            roster_periods = getAffectedRosterPeriods(
              new Date(opt.start_date),
              new Date(opt.end_date)
            ).map((rp: any) => rp.code)
          } catch {
            // fallback
          }
        }
        return { ...opt, roster_periods }
      })

      // Collect all unique roster periods across options
      const allRPs = new Set<string>()
      enrichedOptions.forEach((opt: any) =>
        opt.roster_periods?.forEach((rp: string) => allRPs.add(rp))
      )

      // Extract bid year from first option
      let bidYear = year
      if (enrichedOptions.length > 0 && enrichedOptions[0].start_date) {
        bidYear = new Date(enrichedOptions[0].start_date).getFullYear()
      }

      const pilot = bid.pilots || {}
      return {
        ...bid,
        leave_bid_options: enrichedOptions,
        roster_periods_all: Array.from(allRPs),
        bid_year: bidYear,
        rank: pilot.role || 'N/A',
      }
    })

    // Filter by year if specified
    const filteredBids = yearParam ? bids.filter((b) => b.bid_year === year) : bids

    if (filteredBids.length === 0) {
      return NextResponse.json(
        {
          error: `No leave bids found for year ${year}`,
          details: `No leave bids available for export in year ${year}.`,
        },
        { status: 404 }
      )
    }

    // Compute summary stats for the PDF
    const approvedCount = filteredBids.filter((b) => b.status === 'APPROVED').length
    const summary = {
      totalBids: filteredBids.length,
      byStatus: {
        pending: filteredBids.filter((b) => b.status === 'PENDING').length,
        processing: filteredBids.filter((b) => b.status === 'PROCESSING').length,
        approved: approvedCount,
        rejected: filteredBids.filter((b) => b.status === 'REJECTED').length,
      },
      byRank: {
        captain: filteredBids.filter((b) => b.rank === 'Captain').length,
        firstOfficer: filteredBids.filter((b) => b.rank === 'First Officer').length,
      },
      bidsByRosterPeriod: filteredBids.reduce(
        (acc: Record<string, number>, bid) => {
          const periods =
            bid.roster_periods_all.length > 0
              ? bid.roster_periods_all
              : [bid.roster_period_code || 'N/A']
          periods.forEach((rp: string) => {
            acc[rp] = (acc[rp] || 0) + 1
          })
          return acc
        },
        {} as Record<string, number>
      ),
      approvalRate:
        filteredBids.length > 0 ? Math.round((approvedCount / filteredBids.length) * 100) : 0,
      statusFilter,
    }

    // Generate PDF
    const pdfBuffer = await generateLeaveBidsPDF(filteredBids, year, statusFilter, summary)

    // Convert buffer to arrayBuffer for Response
    const arrayBuffer: ArrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer

    // Return PDF response
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set(
      'Content-Disposition',
      `attachment; filename="leave-bids-${year}${statusFilter !== 'all' ? '-' + statusFilter : ''}-${new Date().toISOString().split('T')[0]}.pdf"`
    )
    headers.set('Content-Length', arrayBuffer.byteLength.toString())

    return new Response(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
