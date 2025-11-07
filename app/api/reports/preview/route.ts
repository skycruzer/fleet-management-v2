/**
 * Report Preview API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Generates report preview data without PDF generation
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReport } from '@/lib/services/reports-service'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportPreviewRequestSchema } from '@/lib/validations/reports-schema'
import { z } from 'zod'

const log = process.env.LOGTAIL_SOURCE_TOKEN
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null

export async function POST(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      log?.warn('Unauthorized report preview attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Rate limiting
    const identifier = user.id
    const { success: rateLimitSuccess } = await authRateLimit.limit(identifier)

    if (!rateLimitSuccess) {
      log?.warn('Rate limit exceeded for report preview', {
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
    const validationResult = ReportPreviewRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      log?.warn('Report preview validation failed', {
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

    log?.info('Report preview requested', {
      userId: user.id,
      email: user.email,
      reportType,
      filterCount: filters ? Object.keys(filters).length : 0,
      timestamp: new Date().toISOString(),
    })

    // Preview uses pagination (fullExport=false) but includes user context
    // Use empty object if filters is undefined
    const report = await generateReport(reportType, filters ?? {}, false, user.email || user.id)

    log?.info('Report preview generated successfully', {
      userId: user.id,
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
