/**
 * Roster Period Report API Endpoint
 *
 * Generates comprehensive roster period reports for submission to rostering team.
 * Supports JSON and PDF formats.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateRosterPeriodReport,
  saveRosterReport,
  getRosterReportHistory,
} from '@/lib/services/roster-report-service'
import { logger } from '@/lib/services/logging-service'

// ============================================================================
// GET /api/reports/roster-period/[code]
// ============================================================================

/**
 * Get roster period report
 *
 * Query Parameters:
 * - format: 'json' | 'pdf' (default: 'json')
 * - reportType: 'PREVIEW' | 'FINAL' (default: 'PREVIEW')
 * - history: 'true' to get report history instead
 *
 * @example
 * GET /api/reports/roster-period/RP01%2F2026?format=json&reportType=PREVIEW
 * GET /api/reports/roster-period/RP01%2F2026?history=true
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rosterPeriodCode = decodeURIComponent(resolvedParams.code)
    const searchParams = request.nextUrl.searchParams
    const showHistory = searchParams.get('history') === 'true'

    logger.info('GET /api/reports/roster-period/[code]', {
      rosterPeriodCode,
      showHistory,
      userId: user.id,
    })

    // ========================================================================
    // Return Report History
    // ========================================================================

    if (showHistory) {
      const result = await getRosterReportHistory(rosterPeriodCode)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
      })
    }

    // ========================================================================
    // Generate New Report
    // ========================================================================

    const format = searchParams.get('format') || 'json'
    const reportType = (searchParams.get('reportType') || 'PREVIEW') as 'PREVIEW' | 'FINAL'

    const result = await generateRosterPeriodReport(rosterPeriodCode, reportType, user.id)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate report' },
        { status: 500 }
      )
    }

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }

    // Return PDF format
    if (format === 'pdf') {
      // Note: PDF generation should be done on the client-side or with a server-compatible library
      // This endpoint returns the report data so the client can generate the PDF
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Use the /generate-pdf endpoint to create PDF on client-side',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format. Use json or pdf.' },
      { status: 400 }
    )
  } catch (error: any) {
    logger.error('Error in GET /api/reports/roster-period/[code]', { error })
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/reports/roster-period/[code]
// ============================================================================

/**
 * Save roster period report to database
 *
 * Request Body:
 * {
 *   "reportType": "PREVIEW" | "FINAL",
 *   "pdfUrl": "optional-s3-url"
 * }
 *
 * @example
 * POST /api/reports/roster-period/RP01%2F2026
 * Body: { "reportType": "FINAL", "pdfUrl": "https://..." }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rosterPeriodCode = decodeURIComponent(resolvedParams.code)
    const body = await request.json()
    const { reportType = 'PREVIEW', pdfUrl } = body

    logger.info('POST /api/reports/roster-period/[code]', {
      rosterPeriodCode,
      reportType,
      userId: user.id,
    })

    // Generate report
    const reportResult = await generateRosterPeriodReport(rosterPeriodCode, reportType, user.id)

    if (!reportResult.success || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: reportResult.error || 'Failed to generate report' },
        { status: 500 }
      )
    }

    // Save report to database
    const saveResult = await saveRosterReport(reportResult.data, pdfUrl)

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: saveResult.error || 'Failed to save report' },
        { status: 500 }
      )
    }

    logger.info('Roster report saved successfully', {
      rosterPeriodCode,
      reportId: saveResult.data,
    })

    return NextResponse.json({
      success: true,
      data: {
        reportId: saveResult.data,
        report: reportResult.data,
      },
      message: 'Roster report saved successfully',
    })
  } catch (error: any) {
    logger.error('Error in POST /api/reports/roster-period/[code]', { error })
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
