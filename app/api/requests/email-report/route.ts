/**
 * Requests Email Report API - Send filtered request reports via email
 *
 * POST /api/requests/email-report
 * - Build HTML table from request data and send via Resend
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 10 requests per minute per IP (prevents email spam/abuse)
 *
 * @author Maurice Rondeau
 * @date February 2026
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { logger } from '@/lib/services/logging-service'
import { z } from 'zod'

// ============================================================================
// Validation Schema
// ============================================================================

const RequestItemSchema = z.object({
  name: z.string(),
  rank: z.string(),
  request_category: z.string(),
  request_type: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  days_count: z.number().nullable(),
  roster_period: z.string(),
  workflow_status: z.string(),
})

const EmailRequestSchema = z.object({
  recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
  cc: z.array(z.string().email()).max(10).optional(),
  bcc: z.array(z.string().email()).max(10).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  requests: z.array(RequestItemSchema).min(1, 'At least one request required'),
})

// ============================================================================
// Helpers
// ============================================================================

function getStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return '#10b981'
    case 'DENIED':
      return '#ef4444'
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return '#f59e0b'
    case 'WITHDRAWN':
      return '#6b7280'
    default:
      return '#333333'
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatCategory(cat: string): string {
  switch (cat) {
    case 'LEAVE':
      return 'Leave'
    case 'FLIGHT':
      return 'Flight'
    case 'LEAVE_BID':
      return 'Leave Bid'
    default:
      return cat
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'IN_REVIEW':
      return 'In Review'
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

// ============================================================================
// API Handler
// ============================================================================

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = EmailRequestSchema.parse(body)

    logger.info('Processing requests email report', {
      userId: auth.userId!,
      recipientCount: validated.recipients.length,
      requestCount: validated.requests.length,
    })

    // Check Resend config
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      logger.error('Resend API key not configured')
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    const emailSubject = validated.subject || 'Pilot Requests Report'

    // Build request rows HTML
    const requestRows = validated.requests
      .map(
        (r, i) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; text-align: center; color: #6b7280; font-size: 13px;">${i + 1}</td>
          <td style="padding: 10px 12px; font-weight: 500;">${r.name}</td>
          <td style="padding: 10px 12px; font-size: 13px;">${r.rank}</td>
          <td style="padding: 10px 12px; font-size: 13px;">${formatCategory(r.request_category)}</td>
          <td style="padding: 10px 12px; font-size: 13px;">${r.request_type}</td>
          <td style="padding: 10px 12px; font-size: 13px;">${formatDate(r.start_date)}</td>
          <td style="padding: 10px 12px; font-size: 13px;">${r.end_date ? formatDate(r.end_date) : '—'}</td>
          <td style="padding: 10px 12px; text-align: center; font-size: 13px;">${r.days_count ?? '—'}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 13px;">${r.roster_period}</td>
          <td style="padding: 10px 12px;">
            <span style="color: ${getStatusColor(r.workflow_status)}; font-weight: 600; font-size: 13px;">
              ${formatStatus(r.workflow_status)}
            </span>
          </td>
        </tr>`
      )
      .join('')

    // Build summary stats
    const statusCounts = validated.requests.reduce(
      (acc, r) => {
        acc[r.workflow_status] = (acc[r.workflow_status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const summaryItems = Object.entries(statusCounts)
      .map(
        ([status, count]) =>
          `<span style="color: ${getStatusColor(status)}; font-weight: 600;">${count}</span> ${formatStatus(status)}`
      )
      .join(' &bull; ')

    // Escape message for HTML (convert newlines to <br>)
    const messageHtml = validated.message
      ? validated.message
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      : ''

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 22px;">Pilot Requests Report</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${validated.requests.length} request${validated.requests.length !== 1 ? 's' : ''}</p>
  </div>

  <div style="padding: 24px; max-width: 900px; margin: 0 auto;">
    ${messageHtml ? `<div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; font-size: 14px;">${messageHtml}</div>` : ''}

    <div style="margin-bottom: 16px; font-size: 14px; color: #6b7280;">
      Summary: ${summaryItems}
    </div>

    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">#</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Pilot</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Rank</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Category</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Type</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Start</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">End</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Days</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">RP</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${requestRows}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View in Dashboard
      </a>
    </div>
  </div>

  <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb;">
    <p>Fleet Management System — Air Niugini B767 Operations</p>
    <p>Generated on ${new Date().toLocaleString('en-US')}</p>
  </div>
</body>
</html>`

    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Fleet Management <noreply@fleetmanagement.com>',
      to: validated.recipients,
      ...(validated.cc && validated.cc.length > 0 ? { cc: validated.cc } : {}),
      ...(validated.bcc && validated.bcc.length > 0 ? { bcc: validated.bcc } : {}),
      subject: emailSubject,
      html: emailBody,
    })

    if (!emailResult.data) {
      logger.error('Failed to send requests email report', { error: emailResult.error })
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    logger.info('Requests email report sent successfully', {
      userId: auth.userId!,
      emailId: emailResult.data.id,
      recipientCount: validated.recipients.length,
      requestCount: validated.requests.length,
    })

    return NextResponse.json({
      success: true,
      data: { emailId: emailResult.data.id },
      message: 'Requests report email sent successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    logger.error('Requests email report API error', { error })
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
})
