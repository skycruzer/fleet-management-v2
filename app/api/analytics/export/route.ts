/**
 * Analytics Export API Route
 * Exports analytics data to PDF or CSV formats
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { exportAnalyticsData } from '@/lib/services/export-service'
import type { AnalyticsExportData, ExportFormat } from '@/lib/services/export-service'

export const dynamic = 'force-dynamic'

export const POST = createAdminRoute(
  {
    operation: 'exportAnalytics',
    endpoint: '/api/analytics/export',
    rateLimit: false,
  },
  async ({ request }) => {
    const ExportBodySchema = z.object({
      format: z.enum(['csv', 'pdf']).optional(),
      data: z.record(z.unknown()).refine((d) => Object.keys(d).length > 0, 'Data cannot be empty'),
    })

    const body = await request.json()
    const parsed = ExportBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }
    const { format: exportFormat = 'csv', data } = parsed.data
    const analyticsData = data as unknown as AnalyticsExportData

    // Use service layer to generate export
    const exportResult = await exportAnalyticsData(analyticsData, {
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
  }
)
