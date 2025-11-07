/**
 * Report PDF Export API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Generates and downloads report as PDF
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReport, generatePDF } from '@/lib/services/reports-service'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportExportRequestSchema } from '@/lib/validations/reports-schema'
import { z } from 'zod'

const log = process.env.LOGTAIL_SOURCE_TOKEN
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null

// Rate limiter for PDF generation (stricter limits)
const rateLimit = authRateLimit

export async function POST(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
    const identifier = user.id
    const { success: rateLimitSuccess } = await rateLimit.limit(identifier)

    if (!rateLimitSuccess) {
      log?.warn('Rate limit exceeded for PDF export', {
        userId: user.id,
        email: user.email,
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
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      log?.warn('PDF export validation failed', {
        userId: user.id,
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
      userId: user.id,
      email: user.email,
      reportType,
      filterCount: filters ? Object.keys(filters).length : 0,
      timestamp: new Date().toISOString(),
    })

    const startTime = Date.now()

    // Generate report data with fullExport=true and user context
    // Use empty object if filters is undefined
    const report = await generateReport(reportType, filters ?? {}, true, user.email || user.id)

    // Generate PDF
    const pdfBuffer = generatePDF(report, reportType)

    const executionTime = Date.now() - startTime

    log?.info('PDF export generated successfully', {
      userId: user.id,
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
