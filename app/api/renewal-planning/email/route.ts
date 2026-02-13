/**
 * Email Renewal Plan API Route
 * POST /api/renewal-planning/email
 *
 * Sends renewal plan to rostering team via email using Resend API
 *
 * COMPLETE IMPLEMENTATION:
 * - Resend API integration with retry logic
 * - Professional HTML email template
 * - Exponential backoff for retries
 * - Audit logging for sent emails
 * - Comprehensive error handling
 * - Data validation before sending
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - RESEND_API_KEY: Your Resend API key (get from https://resend.com/api-keys)
 * - RESEND_FROM_EMAIL: Sender email (must be verified domain, e.g., 'Fleet Management <no-reply@yourdomain.com>')
 * - RESEND_TO_EMAIL: Recipient email (e.g., 'rostering-team@airniugini.com')
 * - NEXT_PUBLIC_APP_URL: Application base URL (for links in email)
 *
 * SETUP INSTRUCTIONS:
 * 1. Install Resend: npm install resend
 * 2. Sign up at https://resend.com and get API key
 * 3. Verify your sending domain in Resend dashboard
 * 4. Add environment variables to .env.local:
 *    RESEND_API_KEY=re_xxxxxxxxxxxxx
 *    RESEND_FROM_EMAIL="Fleet Management <no-reply@yourdomain.com>"
 *    RESEND_TO_EMAIL="rostering-team@airniugini.com"
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'
import { createAuditLog } from '@/lib/services/audit-service'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const dynamic = 'force-dynamic'

// Exponential backoff retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000 // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Send email with exponential backoff retry logic
 */
async function sendEmailWithRetry(emailData: any, attempt = 1): Promise<any> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY not configured. Please add it to your .env.local file. Get your API key from https://resend.com/api-keys'
      )
    }

    // Dynamically import Resend (install with: npm install resend)
    // NOTE: This will fail if resend package is not installed
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Fleet Management <onboarding@resend.dev>'
    const toEmail = process.env.RESEND_TO_EMAIL || 'rostering-team@example.com'

    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    return result
  } catch (error: any) {
    console.error(`[Email] Attempt ${attempt} failed:`, error)

    // If package not installed, throw immediately
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'Resend package not installed. Run: npm install resend\n\nAlternatively, you can use SendGrid, AWS SES, or Nodemailer.'
      )
    }

    // Retry logic
    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1) // Exponential backoff
      await sleep(delay)
      return sendEmailWithRetry(emailData, attempt + 1)
    }

    throw error
  }
}

/**
 * Generate professional HTML email template
 */
function generateEmailHTML(data: {
  year: number
  totalRenewals: number
  totalCapacity: number
  overallUtilization: number
  highRiskPeriods: any[]
  summaries: any[]
  appUrl: string
}): string {
  const {
    year,
    totalRenewals,
    totalCapacity,
    overallUtilization,
    highRiskPeriods,
    summaries,
    appUrl,
  } = data

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certification Renewal Plan - ${year}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          color: #1e40af;
          margin: 0;
          font-size: 24px;
        }
        .subtitle {
          color: #6b7280;
          margin: 5px 0 0 0;
          font-size: 14px;
        }
        .summary-box {
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .stat {
          margin: 10px 0;
          font-size: 15px;
        }
        .stat-label {
          font-weight: 600;
          color: #374151;
        }
        .stat-value {
          color: #1f2937;
        }
        .alert-box {
          background-color: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .alert-title {
          color: #991b1b;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .period-item {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .period-item:last-child {
          border-bottom: none;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Certification Renewal Planning Report</h1>
          <p class="subtitle">B767 Fleet - Year ${year}</p>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="summary-box">
          <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">Summary Statistics</h2>
          <div class="stat">
            <span class="stat-label">Total Planned Renewals:</span>
            <span class="stat-value">${totalRenewals}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Capacity:</span>
            <span class="stat-value">${totalCapacity}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Overall Utilization:</span>
            <span class="stat-value">${Math.round(overallUtilization)}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">Roster Periods:</span>
            <span class="stat-value">13 (Full Year Coverage)</span>
          </div>
          <div class="stat">
            <span class="stat-label">High Risk Periods (&gt;80%):</span>
            <span class="stat-value" style="color: ${highRiskPeriods.length > 0 ? '#dc2626' : '#059669'};">
              ${highRiskPeriods.length}
            </span>
          </div>
        </div>

        ${
          highRiskPeriods.length > 0
            ? `
        <div class="alert-box">
          <p class="alert-title">⚠️ High Utilization Periods Detected</p>
          <p style="margin: 0 0 10px 0;">The following roster periods have high utilization (&gt;80%). Consider rescheduling some renewals:</p>
          ${highRiskPeriods
            .map(
              (period: any) => `
            <div class="period-item">
              <strong>${period.rosterPeriod}</strong> - ${Math.round(period.utilizationPercentage)}% utilization
              (${period.totalPlannedRenewals}/${period.totalCapacity} capacity)
            </div>
          `
            )
            .join('')}
        </div>
        `
            : ''
        }

        <h3 style="color: #1e40af;">Roster Period Breakdown</h3>
        <div style="margin: 15px 0;">
          ${summaries
            .map((s: any) => {
              const utilColor =
                s.utilizationPercentage > 80
                  ? '#dc2626'
                  : s.utilizationPercentage > 60
                    ? '#d97706'
                    : '#059669'

              return `
            <div class="period-item">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${s.rosterPeriod}</strong>
                <span style="color: ${utilColor}; font-weight: 600;">
                  ${s.totalPlannedRenewals}/${s.totalCapacity} (${Math.round(s.utilizationPercentage)}%)
                </span>
              </div>
            </div>
          `
            })
            .join('')}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/dashboard/renewal-planning/calendar?year=${year}" class="button">
            View Full Calendar
          </a>
        </div>

        <div class="footer">
          <p><strong>B767 Pilot Management System</strong></p>
          <p>Air Niugini - Fleet Operations</p>
          <p style="margin-top: 10px;">
            This is an automated email. For questions, please contact the Fleet Management team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * POST handler - Send renewal plan email
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const yearParam = formData.get('year')?.toString()

    // Validate year parameter
    if (!yearParam) {
      return NextResponse.json(
        { error: 'Year parameter is required', details: 'Please specify a year' },
        { status: 400 }
      )
    }

    const year = parseInt(yearParam, 10)
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year parameter', details: 'Year must be between 2020 and 2100' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get roster periods for the year
    const { data: periods, error: periodsError } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_start_date', `${year}-12-31`)
      .order('period_start_date')

    if (periodsError) {
      return NextResponse.json(
        { error: 'Failed to fetch roster periods', details: periodsError.message },
        { status: 500 }
      )
    }

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        {
          error: `No roster periods found for year ${year}`,
          details: 'Generate roster periods first before sending email',
        },
        { status: 404 }
      )
    }

    // Get capacity summaries
    const summaries = await Promise.all(
      periods.map(async (p) => {
        const summary = await getRosterPeriodCapacity(p.roster_period)
        return summary
      })
    )

    const validSummaries = summaries.filter((s) => s !== null)

    if (validSummaries.length === 0) {
      return NextResponse.json(
        { error: 'No capacity data available', details: 'Unable to retrieve capacity summaries' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalCapacity = validSummaries.reduce((sum, s) => sum + s.totalCapacity, 0)
    const totalPlanned = validSummaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
    const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0
    const highRiskPeriods = validSummaries.filter((s) => s.utilizationPercentage > 80)

    // Validate that we have renewals to report
    if (totalPlanned === 0) {
      return NextResponse.json(
        {
          error: 'No renewal plans to send',
          details: `No renewals have been planned for ${year} yet. Generate a renewal plan first.`,
        },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate email content
    const emailHTML = generateEmailHTML({
      year,
      totalRenewals: totalPlanned,
      totalCapacity,
      overallUtilization,
      highRiskPeriods,
      summaries: validSummaries,
      appUrl,
    })

    // Plain text version (fallback for email clients that don't support HTML)
    const emailText = `
Certification Renewal Planning Report
Year: ${year}

Summary Statistics:
- Total Planned Renewals: ${totalPlanned}
- Total Capacity: ${totalCapacity}
- Overall Utilization: ${Math.round(overallUtilization)}%
- High Risk Periods (>80%): ${highRiskPeriods.length}

${
  highRiskPeriods.length > 0
    ? `
High Utilization Periods:
${highRiskPeriods.map((p: any) => `- ${p.rosterPeriod}: ${Math.round(p.utilizationPercentage)}% utilization`).join('\n')}
`
    : ''
}

Roster Period Breakdown:
${validSummaries
  .map((s: any) => {
    return `${s.rosterPeriod}: ${s.totalPlannedRenewals}/${s.totalCapacity} (${Math.round(s.utilizationPercentage)}%)`
  })
  .join('\n')}

View full details: ${appUrl}/dashboard/renewal-planning/calendar?year=${year}

---
B767 Pilot Management System
Air Niugini - Fleet Operations
    `.trim()

    // Send email with retry logic
    const emailResult = await sendEmailWithRetry({
      subject: `Certification Renewal Plan - ${year}`,
      html: emailHTML,
      text: emailText,
    })

    // Audit log for email sent
    await createAuditLog({
      action: 'INSERT',
      tableName: 'email_notifications',
      recordId: emailResult.id || 'unknown',
      newData: {
        type: 'renewal_plan',
        year,
        recipient: process.env.RESEND_TO_EMAIL,
        total_renewals: totalPlanned,
        utilization_percentage: overallUtilization,
      },
      description: `Renewal planning email sent for year ${year}`,
    })

    return NextResponse.json({
      success: true,
      message: `Renewal plan email sent successfully for year ${year}`,
      emailId: emailResult.id,
      stats: {
        totalRenewals: totalPlanned,
        totalCapacity,
        utilization: Math.round(overallUtilization),
        highRiskPeriods: highRiskPeriods.length,
      },
    })
  } catch (error: any) {
    console.error('[Email] Error:', error)

    // Special handling for package not installed
    if (error.message?.includes('npm install resend')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured',
          details: error.message,
          setup: [
            '1. Install Resend package: npm install resend',
            '2. Sign up at https://resend.com and get API key',
            '3. Verify your domain in Resend dashboard',
            '4. Add RESEND_API_KEY to .env.local',
            '5. Add RESEND_FROM_EMAIL to .env.local',
            '6. Add RESEND_TO_EMAIL to .env.local',
          ],
        },
        { status: 503 }
      )
    }

    const sanitized = sanitizeError(error, {
      operation: 'sendRenewalPlanEmail',
      endpoint: '/api/renewal-planning/email',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
