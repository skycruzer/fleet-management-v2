/**
 * Leave Bid PDF Export API Route
 * Generates PDF report for leave bid management
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLeaveBidsPDF } from '@/lib/services/leave-bids-pdf-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
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

    // Transform bids to add bid_year
    const bids = leaveBids.map((bid: any) => {
      let bidYear = year
      if (bid.leave_bid_options && bid.leave_bid_options.length > 0) {
        const firstOption = bid.leave_bid_options[0]
        if (firstOption.start_date) {
          bidYear = new Date(firstOption.start_date).getFullYear()
        }
      }
      return {
        ...bid,
        bid_year: bidYear,
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

    console.log(`[PDF Export] Generating PDF for ${filteredBids.length} leave bids`)

    // Generate PDF
    const pdfBuffer = await generateLeaveBidsPDF(filteredBids, year, statusFilter)

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
