/**
 * Report Email API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Sends report via email using Resend.com
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateReport, generatePDF } from '@/lib/services/reports-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { Logtail } from '@logtail/node'
import { ReportEmailRequestSchema } from '@/lib/validations/reports-schema'
import { DEFAULT_FROM_EMAIL } from '@/lib/constants/email'

const log = process.env.LOGTAIL_SOURCE_TOKEN ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN) : null

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    // Authentication check
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      log?.warn('Unauthorized email send attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Rate limiting (strictest for email - prevents spam)
    const identifier = auth.userId!
    const { success: rateLimitSuccess } = await authRateLimit.limit(identifier)

    if (!rateLimitSuccess) {
      log?.warn('Rate limit exceeded for email send', {
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
    const validationResult = ReportEmailRequestSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      log?.warn('Email report validation failed', {
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

    const { reportType, filters, recipients, cc, bcc, subject, message } = validationResult.data

    log?.info('Email report requested', {
      userId: auth.userId!,
      email: auth.email,
      reportType,
      recipientCount: recipients.length,
      ccCount: cc?.length ?? 0,
      bccCount: bcc?.length ?? 0,
      timestamp: new Date().toISOString(),
    })

    // Generate report data with fullExport=true and user context
    // Use empty object if filters is undefined
    const report = await generateReport(reportType, filters ?? {}, true, auth.email || auth.userId!)

    // Row-count pre-check: cheaper to refuse before we burn Lambda CPU/memory
    // on PDF generation we'll immediately discard. autoTable averages ~3-5KB
    // per row depending on column count, so ~3000 rows is the practical ceiling
    // for the 10MB attachment limit. Surfacing this BEFORE generatePDF spares
    // serverless function timeouts on huge pilot-info/forecast exports.
    const MAX_ROWS_FOR_EMAIL = 3000
    if (report.data.length > MAX_ROWS_FOR_EMAIL) {
      log?.warn('Report row count exceeds email-safe threshold', {
        userId: auth.userId!,
        reportType,
        rowCount: report.data.length,
      })
      return NextResponse.json(
        {
          success: false,
          error: `This report has ${report.data.length} rows, which is too large to email. Narrow your filters (max ~${MAX_ROWS_FOR_EMAIL} rows per email) or use Export PDF and share the file manually.`,
        },
        { status: 413 }
      )
    }

    // Generate PDF (pass groupBy for grouped report rendering)
    const pdfBuffer = await generatePDF(report, reportType, filters?.groupBy)

    // Final size guard. Even with the row-count check above, a wide table or
    // long pilot names can push a borderline export over the limit.
    const MAX_PDF_BYTES = 10 * 1024 * 1024
    if (pdfBuffer.length > MAX_PDF_BYTES) {
      log?.warn('Report PDF exceeds email attachment limit', {
        userId: auth.userId!,
        reportType,
        pdfSize: pdfBuffer.length,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Report PDF (${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB) exceeds the ${MAX_PDF_BYTES / 1024 / 1024} MB email attachment limit. Narrow the filters or download the PDF directly.`,
        },
        { status: 413 }
      )
    }

    // Filename uses PNG-local date so it matches the export route's filename
    // pattern and doesn't roll over a day on the UTC server.
    const safeType = reportType.replace(/[^a-z0-9._-]/gi, '_')
    const timestamp = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Port_Moresby',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
    const filename = `${safeType}-report-${timestamp}.pdf`

    // Prepare email content (HTML + plain-text fallback).
    // Resend recommends sending both so spam filters score higher and clients
    // that strip HTML (corporate ticketing systems, screen readers) still see
    // the report metadata.
    const emailSubject = subject || `${report.title} - ${timestamp}`
    const summaryEntries = report.summary ? Object.entries(report.summary) : []
    const formatSummaryLabel = (key: string) =>
      key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())

    const emailHtml =
      message ||
      `
      <h2>${report.title}</h2>
      <p>${report.description}</p>
      <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>

      ${
        summaryEntries.length > 0
          ? `
        <h3>Summary</h3>
        <ul>
          ${summaryEntries
            .map(([key, value]) => {
              return `<li><strong>${formatSummaryLabel(key)}:</strong> ${value}</li>`
            })
            .join('')}
        </ul>
      `
          : ''
      }

      <p>Please find the detailed report attached as a PDF.</p>

      <hr />
      <p style="font-size: 12px; color: #666;">
        This is an automated report from Air Niugini - B767 Fleet Management System
      </p>
    `

    const emailText =
      message ||
      [
        report.title,
        '',
        report.description,
        '',
        `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
        '',
        ...(summaryEntries.length > 0
          ? [
              'Summary:',
              ...summaryEntries.map(([k, v]) => `  - ${formatSummaryLabel(k)}: ${v}`),
              '',
            ]
          : []),
        'Please find the detailed report attached as a PDF.',
        '',
        '--',
        'Air Niugini - B767 Fleet Management System (automated report)',
      ].join('\n')

    const startTime = Date.now()

    // Send email via Resend (with optional CC/BCC)
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      to: recipients,
      ...(cc && cc.length > 0 ? { cc } : {}),
      ...(bcc && bcc.length > 0 ? { bcc } : {}),
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      log?.error('Resend email error', {
        userId: auth.userId!,
        reportType,
        recipientCount: recipients.length,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      throw new Error(`Resend error: ${error.message}`)
    }

    const executionTime = Date.now() - startTime

    log?.info('Email report sent successfully', {
      userId: auth.userId!,
      reportType,
      recipientCount: recipients.length,
      messageId: data?.id,
      pdfSize: pdfBuffer.length,
      executionTime,
    })

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    })
  } catch (error) {
    log?.error('Email send error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    )
  }
}
