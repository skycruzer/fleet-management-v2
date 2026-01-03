/**
 * Report PDF Export API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Generates and downloads report as PDF
 */

import { NextResponse } from 'next/server'
import { generateReport, generatePDF } from '@/lib/services/reports-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportExportRequestSchema } from '@/lib/validations/reports-schema'
import { z } from 'zod'

const log = process.env.LOGTAIL_SOURCE_TOKEN ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN) : null

// Rate limiter for PDF generation (stricter limits)
const rateLimit = authRateLimit

export async function POST(request: Request) {
  try {
    // Authentication check
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      log?.warn('Unauthorized PDF export attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Rate limiting (stricter for PDF generation - more resource intensive)
    const identifier = auth.userId!
    const { success: rateLimitSuccess } = await rateLimit.limit(identifier)

    if (!rateLimitSuccess) {
      log?.warn('Rate limit exceeded for PDF export', {
        userId: auth.userId!,
        email: auth.email,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate request body with Zod
    const validationResult = ReportExportRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      log?.warn('PDF export validation failed', {
        userId: auth.userId!,
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
      userId: auth.userId!,
      email: auth.email,
      reportType,
      filterCount: filters ? Object.keys(filters).length : 0,
      timestamp: new Date().toISOString(),
    })

    const startTime = Date.now()

    // Generate report data with fullExport=true and user context
    // Use empty object if filters is undefined
    const report = await generateReport(reportType, filters ?? {}, true, auth.email || auth.userId!)

    // Generate PDF
    const pdfBuffer = await generatePDF(report, reportType)

    const executionTime = Date.now() - startTime

    log?.info('PDF export generated successfully', {
      userId: auth.userId!,
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
