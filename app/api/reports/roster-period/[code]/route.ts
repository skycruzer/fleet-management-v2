/**
 * Roster Period Report API Endpoint
 *
 * Generates comprehensive roster period reports for submission to rostering team.
 * Supports JSON and PDF formats.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  generateRosterPeriodReport,
  saveRosterReport,
  getRosterReportHistory,
} from '@/lib/services/roster-report-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
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
export const GET = createAdminRoute(
  {
    operation: 'getRosterPeriodReport',
    endpoint: '/api/reports/roster-period/[code]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params, admin }) => {
    try {
      const rosterPeriodCode = decodeURIComponent(params.code)
      const searchParams = request.nextUrl.searchParams
      const showHistory = searchParams.get('history') === 'true'

      logger.info('GET /api/reports/roster-period/[code]', {
        rosterPeriodCode,
        showHistory,
        userId: admin.userId,
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
      const rawReportType = searchParams.get('reportType') ?? 'PREVIEW'
      if (rawReportType !== 'PREVIEW' && rawReportType !== 'FINAL') {
        return NextResponse.json(
          { success: false, error: 'Invalid reportType. Use PREVIEW or FINAL.' },
          { status: 400 }
        )
      }
      const reportType: 'PREVIEW' | 'FINAL' = rawReportType

      // PDF format is intentionally unsupported on this route — generation is
      // client-driven via lib/services/roster-pdf-service.ts. Fail loudly so
      // callers don't silently consume JSON when expecting a PDF binary.
      if (format === 'pdf') {
        return NextResponse.json(
          {
            success: false,
            error:
              'PDF format not implemented for this endpoint. Generate the PDF client-side from the JSON response.',
          },
          { status: 501 }
        )
      }

      if (format !== 'json') {
        return NextResponse.json(
          { success: false, error: 'Invalid format. Use json.' },
          { status: 400 }
        )
      }

      const result = await generateRosterPeriodReport(rosterPeriodCode, reportType, admin.userId)

      if (!result.success || !result.data) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to generate report' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } catch (error: any) {
      logger.error('Error in GET /api/reports/roster-period/[code]', { error })
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
)

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
export const POST = createAdminRoute(
  {
    operation: 'saveRosterPeriodReport',
    endpoint: '/api/reports/roster-period/[code]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, params, admin }) => {
    try {
      const rosterPeriodCode = decodeURIComponent(params.code)
      const RosterReportBodySchema = z.object({
        reportType: z.enum(['PREVIEW', 'FINAL']).optional(),
        pdfUrl: z.string().optional(),
      })

      const body = await request.json()
      const parsed = RosterReportBodySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.issues },
          { status: 400 }
        )
      }
      const { reportType = 'PREVIEW', pdfUrl } = parsed.data

      logger.info('POST /api/reports/roster-period/[code]', {
        rosterPeriodCode,
        reportType,
        userId: admin.userId,
      })

      // Generate report
      const reportResult = await generateRosterPeriodReport(
        rosterPeriodCode,
        reportType,
        admin.userId
      )

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
)
