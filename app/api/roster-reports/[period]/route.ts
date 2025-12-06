/**
 * Roster Report API - Generate and retrieve reports for specific roster period
 *
 * GET /api/roster-reports/[period]
 * - Generate roster period report
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRosterPeriodReport, saveRosterReport } from '@/lib/services/roster-report-service'
import { logger } from '@/lib/services/logging-service'

/**
 * GET /api/roster-reports/[period]
 *
 * Generate roster period report for the specified period
 *
 * Query params:
 * - reportType: 'PREVIEW' | 'FINAL' (default: PREVIEW)
 * - save: 'true' | 'false' (default: false) - whether to save to database
 */
export async function GET(request: NextRequest, { params }: { params: { period: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const period = params.period

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const reportType = (searchParams.get('reportType') as 'PREVIEW' | 'FINAL') || 'PREVIEW'
    const shouldSave = searchParams.get('save') === 'true'

    logger.info('Generating roster period report', {
      userId: user.id,
      period,
      reportType,
      shouldSave,
    })

    // Generate report
    const result = await generateRosterPeriodReport(period, reportType, user.id)

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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
