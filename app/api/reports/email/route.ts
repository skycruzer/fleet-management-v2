/**
 * Report Email API Route
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Sends report via email using Resend.com
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateReport, generatePDF } from '@/lib/services/reports-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
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

export const POST = createAdminRoute(
  {
    operation: 'emailReport',
    endpoint: '/api/reports/email',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request, admin }) => {
    try {
      const body = await request.json()

      // Validate request body with Zod
      const validationResult = ReportEmailRequestSchema.safeParse(body)

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        log?.warn('Email report validation failed', {
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

      const { reportType, filters, recipients, cc, bcc, subject, message } = validationResult.data

      log?.info('Email report requested', {
        userId: admin.userId,
        email: admin.email,
        reportType,
        recipientCount: recipients.length,
        ccCount: cc?.length ?? 0,
        bccCount: bcc?.length ?? 0,
        timestamp: new Date().toISOString(),
      })

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

      // Guard against runaway attachments — Resend re-encodes to base64 (~1.33×),
      // and Lambda memory blows up on multi-MB forecast/pilot-info exports.
      const MAX_PDF_BYTES = 10 * 1024 * 1024
      if (pdfBuffer.length > MAX_PDF_BYTES) {
        log?.warn('Report PDF exceeds email attachment limit', {
          userId: admin.userId,
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

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${reportType}-report-${timestamp}.pdf`

      // Prepare email content
      const emailSubject = subject || `${report.title} - ${timestamp}`
      const emailBody =
        message ||
        `
      <h2>${report.title}</h2>
      <p>${report.description}</p>
      <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>

      ${
        report.summary
          ? `
        <h3>Summary</h3>
        <ul>
          ${Object.entries(report.summary)
            .map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
              return `<li><strong>${label}:</strong> ${value}</li>`
            })
            .join('')}
        </ul>
      `
          : ''
      }

      <p>Please find the detailed report attached as a PDF.</p>

      <hr />
      <p style="font-size: 12px; color: #666;">
        This is an automated report from Air Niugini - Fleet Office
      </p>
    `

      const startTime = Date.now()

      // Send email via Resend (with optional CC/BCC)
      const { data, error } = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to: recipients,
        ...(cc && cc.length > 0 ? { cc } : {}),
        ...(bcc && bcc.length > 0 ? { bcc } : {}),
        subject: emailSubject,
        html: emailBody,
        attachments: [
          {
            filename,
            content: pdfBuffer,
          },
        ],
      })

      if (error) {
        log?.error('Resend email error', {
          userId: admin.userId,
          reportType,
          recipientCount: recipients.length,
          error: error.message,
          timestamp: new Date().toISOString(),
        })
        throw new Error(`Resend error: ${error.message}`)
      }

      const executionTime = Date.now() - startTime

      log?.info('Email report sent successfully', {
        userId: admin.userId,
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
)
