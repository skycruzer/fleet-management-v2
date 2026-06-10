/**
 * Report Preview API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Generates report preview data without PDF generation
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/services/reports-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportPreviewRequestSchema } from '@/lib/validations/reports-schema'

const log = process.env.LOGTAIL_SOURCE_TOKEN ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN) : null

export const POST = createAdminRoute(
  {
    operation: 'generateReportPreview',
    endpoint: '/api/reports/preview',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    try {
      const body = await request.json()

      // Validate request body with Zod
      const validationResult = ReportPreviewRequestSchema.safeParse(body)

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        log?.warn('Report preview validation failed', {
          userId: admin.userId,
          errors,
          body,
          timestamp: new Date().toISOString(),
        })

        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        )
      }

      const { reportType, filters } = validationResult.data

      log?.info('Report preview requested', {
        userId: admin.userId,
        email: admin.email,
        reportType,
        filterCount: filters ? Object.keys(filters).length : 0,
        timestamp: new Date().toISOString(),
      })

      // Preview uses pagination (fullExport=false) but includes user context
      // Use empty object if filters is undefined
      const report = await generateReport(
        reportType,
        filters ?? {},
        false,
        admin.email || admin.userId
      )

      log?.info('Report preview generated successfully', {
        userId: admin.userId,
        reportType,
        resultCount: report.data.length,
        executionTime: Date.now() - new Date(report.generatedAt).getTime(),
      })

      return NextResponse.json({
        success: true,
        report,
      })
    } catch (error) {
      log?.error('Report preview error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate report preview',
        },
        { status: 500 }
      )
    }
  }
)
