/**
 * Roster Report API - Generate and retrieve reports for specific roster period
 *
 * GET /api/roster-reports/[period]
 * - Generate roster period report
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { generateRosterPeriodReport, saveRosterReport } from '@/lib/services/roster-report-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logger } from '@/lib/services/logging-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/roster-reports/[period]
 *
 * Generate roster period report for the specified period
 *
 * Query params:
 * - reportType: 'PREVIEW' | 'FINAL' (default: PREVIEW)
 * - save: 'true' | 'false' (default: false) - whether to save to database
 */
export const GET = createAdminRoute(
  {
    operation: 'generateRosterPeriodReport',
    endpoint: '/api/roster-reports/[period]',
    rateLimit: false,
  },
  async ({ request, params, admin }) => {
    try {
      const period = params.period

      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const reportType = (searchParams.get('reportType') as 'PREVIEW' | 'FINAL') || 'PREVIEW'
      const shouldSave = searchParams.get('save') === 'true'

      logger.info('Generating roster period report', {
        userId: admin.userId,
        period,
        reportType,
        shouldSave,
      })

      // Generate report
      const result = await generateRosterPeriodReport(period, reportType, admin.userId)

      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to generate roster report',
          },
          { status: 500 }
        )
      }

      // Save to database if requested
      if (shouldSave) {
        const saveResult = await saveRosterReport(result.data)

        if (!saveResult.success) {
          logger.warn('Failed to save roster report to database', {
            error: saveResult.error,
          })
          // Don't fail the whole request - just log the warning
        } else {
          logger.info('Roster report saved to database', {
            reportId: saveResult.data,
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message,
      })
    } catch (error: any) {
      logger.error('Roster report generation API error', { error })
      const s = sanitizeError(error, {
        operation: 'generateRosterPeriodReport',
        endpoint: '/api/roster-reports/[period]',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
