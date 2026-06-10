/**
 * Report PDF Export API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Generates and downloads report as PDF
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { generateReport, generatePDF } from '@/lib/services/reports-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportExportRequestSchema } from '@/lib/validations/reports-schema'

const log = process.env.LOGTAIL_SOURCE_TOKEN ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN) : null

// PDF export shares the general auth limiter (10/min). If real-world use shows
// PDF generation needs tighter throttling, add a dedicated limiter in lib/rate-limit.ts.

export const POST = createAdminRoute(
  {
    operation: 'exportReportPdf',
    endpoint: '/api/reports/export',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    try {
      const body = await request.json()

      // Validate request body with Zod
      const validationResult = ReportExportRequestSchema.safeParse(body)

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        log?.warn('PDF export validation failed', {
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

      log?.info('PDF export requested', {
        userId: admin.userId,
        email: admin.email,
        reportType,
        filterCount: filters ? Object.keys(filters).length : 0,
        timestamp: new Date().toISOString(),
      })

      const startTime = Date.now()

      // Generate report data with fullExport=true and user context
      // Use empty object if filters is undefined
      const report = await generateReport(
        reportType,
        filters ?? {},
        true,
        admin.email || admin.userId
      )

      // Generate PDF (pass groupBy for grouped report rendering)
      const pdfBuffer = await generatePDF(report, reportType, filters?.groupBy)

      const executionTime = Date.now() - startTime

      log?.info('PDF export generated successfully', {
        userId: admin.userId,
        reportType,
        resultCount: report.data.length,
        pdfSize: pdfBuffer.length,
        executionTime,
      })

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${reportType}-report-${timestamp}.pdf`

      // Return PDF as downloadable file
      // Convert Buffer to Uint8Array for NextResponse
      const uint8Array = new Uint8Array(pdfBuffer)

      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': uint8Array.length.toString(),
        },
      })
    } catch (error) {
      log?.error('PDF export error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export PDF',
        },
        { status: 500 }
      )
    }
  }
)
