/**
 * Analytics Export API Route
 * Exports analytics data to PDF or CSV formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { exportAnalyticsData } from '@/lib/services/export-service'
import type { AnalyticsExportData, ExportFormat } from '@/lib/services/export-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { format: exportFormat = 'csv', data } = body

    if (!data) {
      return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 })
    }

    // Validate data structure
    const analyticsData: AnalyticsExportData = data

    // Use service layer to generate export
    const exportResult = exportAnalyticsData(analyticsData, {
      format: exportFormat as ExportFormat,
      includeTimestamp: true,
      title: 'Fleet Analytics Report',
    })

    // Convert Buffer to Uint8Array for NextResponse compatibility
    let responseBody: BodyInit
    if (Buffer.isBuffer(exportResult.content)) {
      responseBody = new Uint8Array(exportResult.content)
    } else {
      responseBody = exportResult.content
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'exportAnalytics',
      endpoint: '/api/analytics/export',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
