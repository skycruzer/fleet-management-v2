/**
 * Roster Report Email API - Send roster reports via email
 *
 * POST /api/roster-reports/[period]/email
 * - Generate PDF and email to roster team
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRosterPeriodReport, saveRosterReport } from '@/lib/services/roster-report-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logger } from '@/lib/services/logging-service'
import { z } from 'zod'
import { DEFAULT_FROM_EMAIL } from '@/lib/constants/email'

// ============================================================================
// Validation Schemas
// ============================================================================

const EmailRequestSchema = z.object({
  recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
  cc: z.array(z.string().email()).max(10, 'Maximum 10 CC recipients').optional(),
  bcc: z.array(z.string().email()).max(10, 'Maximum 10 BCC recipients').optional(),
  subject: z.string().min(1, 'Subject required').optional(),
  message: z.string().optional(),
  reportType: z.enum(['PREVIEW', 'FINAL']).default('FINAL'),
  includeOptions: z
    .object({
      includeDenied: z.boolean().default(true),
      includeAvailability: z.boolean().default(true),
    })
    .optional(),
})

type EmailRequest = z.infer<typeof EmailRequestSchema>

// ============================================================================
// API Handler
// ============================================================================

/**
 * POST /api/roster-reports/[period]/email
 *
 * Generate roster report PDF and send via email
 *
 * Request body:
 * {
 *   recipients: string[] (email addresses),
 *   subject?: string,
 *   message?: string,
 *   reportType?: 'PREVIEW' | 'FINAL',
 *   includeOptions?: {
 *     includeDenied?: boolean,
 *     includeAvailability?: boolean
 *   }
 * }
 */
export const POST = createAdminRoute(
  {
    operation: 'sendRosterReportEmail',
    endpoint: '/api/roster-reports/[period]/email',
    rateLimit: false,
  },
  async ({ request, params, admin }) => {
    try {
      // Parse and validate request body
      const body = await request.json()
      const validated = EmailRequestSchema.parse(body)

      const { period } = params

      logger.info('Processing roster report email request', {
        userId: admin.userId,
        period,
        reportType: validated.reportType,
        recipientCount: validated.recipients.length,
        ccCount: validated.cc?.length ?? 0,
        bccCount: validated.bcc?.length ?? 0,
      })

      // Step 1: Generate report data
      const reportResult = await generateRosterPeriodReport(
        period,
        validated.reportType,
        admin.userId
      )

      if (!reportResult.success || !reportResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: reportResult.error || 'Failed to generate roster report',
          },
          { status: 500 }
        )
      }

      const report = reportResult.data

      // Step 2: This endpoint sends an HTML summary only. PDF generation for
      // roster reports is intentionally client-side (lib/services/roster-pdf-service.ts
      // gates on `typeof window`), so the email body links back to the dashboard
      // where the user can download the full PDF.

      // Check if Resend API key is available
      const resendApiKey = process.env.RESEND_API_KEY

      if (!resendApiKey) {
        logger.error('Resend API key not configured')
        return NextResponse.json(
          {
            success: false,
            error: 'Email service not configured. Please contact administrator.',
          },
          { status: 500 }
        )
      }

      const { Resend } = await import('resend')
      const resend = new Resend(resendApiKey)

      // Build email content
      const emailSubject =
        validated.subject || `Roster Period Report - ${period} (${validated.reportType})`

      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #b45a3c; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .stats { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .stat-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #b45a3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Roster Period Request Report</h1>
    <p>${period}</p>
  </div>

  <div class="content">
    ${validated.message ? `<p>${validated.message}</p>` : ''}

    <h2>Report Summary</h2>

    <div class="stats">
      <div class="stat-row">
        <strong>Report Type:</strong>
        <span>${validated.reportType}</span>
      </div>
      <div class="stat-row">
        <strong>Period:</strong>
        <span>${report.rosterPeriod.startDate} to ${report.rosterPeriod.endDate}</span>
      </div>
      <div class="stat-row">
        <strong>Total Requests:</strong>
        <span>${report.statistics.totalRequests}</span>
      </div>
      <div class="stat-row">
        <strong>Approved:</strong>
        <span style="color: #10b981;">${report.statistics.approvedCount}</span>
      </div>
      <div class="stat-row">
        <strong>Denied:</strong>
        <span style="color: #ef4444;">${report.statistics.deniedCount}</span>
      </div>
      <div class="stat-row">
        <strong>Pending:</strong>
        <span style="color: #f59e0b;">${report.statistics.pendingCount}</span>
      </div>
    </div>

    <h3>Crew Availability</h3>
    <div class="stats">
      <div class="stat-row">
        <strong>Captains Available:</strong>
        <span>${report.crewAvailability.captains.available} / ${report.crewAvailability.captains.totalCrew} (${report.crewAvailability.captains.percentageAvailable.toFixed(1)}%)</span>
      </div>
      <div class="stat-row">
        <strong>First Officers Available:</strong>
        <span>${report.crewAvailability.firstOfficers.available} / ${report.crewAvailability.firstOfficers.totalCrew} (${report.crewAvailability.firstOfficers.percentageAvailable.toFixed(1)}%)</span>
      </div>
    </div>

    ${
      report.crewAvailability.captains.belowMinimum ||
      report.crewAvailability.firstOfficers.belowMinimum
        ? `
    <div class="alert">
      <strong>⚠️ Warning: Minimum Crew Threshold</strong>
      <p>Crew availability falls below the minimum requirement of 10 during this roster period.</p>
      ${
        report.crewAvailability.minimumCrewDate
          ? `<p>Minimum occurs on: ${report.crewAvailability.minimumCrewDate}</p>`
          : ''
      }
    </div>
    `
        : ''
    }

    <h3>Approved Requests Breakdown</h3>
    <ul>
      <li>Leave Requests: ${report.approvedRequests.leaveRequests.length}</li>
      <li>RDO/SDO Requests: ${report.approvedRequests.flightRequests.length}</li>
      <li>Leave Bids: ${report.approvedRequests.leaveBids.length}</li>
    </ul>

    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests?roster=${period}" class="button">View Full Report in Dashboard</a></p>

    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      <strong>Note:</strong> This report was generated automatically. To generate a PDF version,
      please visit the dashboard and use the "Download PDF" option.
    </p>
  </div>

  <div class="footer">
    <p>Fleet Office - Air Niugini B767 Operations</p>
    <p>Generated on ${new Date(report.metadata.generatedAt).toLocaleString('en-AU')}</p>
  </div>
</body>
</html>
    `

      // Send email (with optional CC/BCC)
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to: validated.recipients,
        ...(validated.cc && validated.cc.length > 0 ? { cc: validated.cc } : {}),
        ...(validated.bcc && validated.bcc.length > 0 ? { bcc: validated.bcc } : {}),
        subject: emailSubject,
        html: emailBody,
      })

      if (!emailResult.data) {
        logger.error('Failed to send roster report email', { error: emailResult.error })
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to send email. Please try again.',
          },
          { status: 500 }
        )
      }

      // Save report to database; warn (don't fail the request) if persistence misses
      const saveResult = await saveRosterReport(report)
      if (!saveResult.success) {
        logger.warn('Roster report email sent but persistence failed', {
          period,
          reportType: validated.reportType,
          error: saveResult.error,
        })
      }

      // Update roster_reports table with sent_at timestamp
      // Note: sent_to column exists in DB but not in generated types — regenerate with `npm run db:types`
      const supabase = createAdminClient()
      const emailUpdatePayload: Record<string, unknown> = {
        sent_at: new Date().toISOString(),
        sent_to: validated.recipients,
      }
      const { error: updateError } = await supabase
        .from('roster_reports')
        .update(emailUpdatePayload as never)
        .eq('roster_period_code', period)
        .eq('report_type', validated.reportType)
        .order('generated_at', { ascending: false })
        .limit(1)

      if (updateError) {
        logger.warn('Failed to update roster report sent timestamp', {
          period,
          reportType: validated.reportType,
          error: updateError.message,
        })
      }

      logger.info('Roster report email sent successfully', {
        userId: admin.userId,
        period,
        reportType: validated.reportType,
        emailId: emailResult.data.id,
        recipientCount: validated.recipients.length,
      })

      return NextResponse.json({
        success: true,
        data: {
          emailId: emailResult.data.id,
          report: report,
        },
        message: 'Roster report summary email sent successfully',
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.issues,
          },
          { status: 400 }
        )
      }

      logger.error('Roster report email API error', { error })
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
      )
    }
  }
)
