/**
 * Email Renewal Plan API Route
 * POST /api/renewal-planning/email
 *
 * Sends renewal plan to rostering team via email
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const year = formData.get('year')?.toString() || new Date().getFullYear().toString()

    const supabase = await createClient()

    // Get roster periods for the year
    const { data: periods } = await supabase
      .from('roster_period_capacity')
      .select('roster_period, period_start_date, period_end_date')
      .gte('period_start_date', `${year}-02-01`)
      .lte('period_start_date', `${year}-11-30`)
      .order('period_start_date')

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { error: `No roster periods found for year ${year}` },
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

    // Calculate statistics
    const totalCapacity = validSummaries.reduce((sum, s) => sum + s.totalCapacity, 0)
    const totalPlanned = validSummaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
    const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0
    const highRiskPeriods = validSummaries.filter((s) => s.utilizationPercentage > 80)

    // In a real implementation, you would send an email here using a service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP

    // For now, we'll log the email content and return success
    const emailContent = {
      to: 'rostering-team@example.com',
      subject: `Certification Renewal Plan - ${year}`,
      body: `
        Certification Renewal Planning Report
        Year: ${year}

        Summary Statistics:
        - Total Planned Renewals: ${totalPlanned}
        - Total Capacity: ${totalCapacity}
        - Overall Utilization: ${Math.round(overallUtilization)}%
        - High Risk Periods (>80%): ${highRiskPeriods.length}

        Roster Period Breakdown:
        ${validSummaries
          .map(
            (s) => `
        ${s.rosterPeriod}:
        - Utilization: ${Math.round(s.utilizationPercentage)}%
        - Planned: ${s.totalPlannedRenewals}/${s.totalCapacity}
        `
          )
          .join('\n')}

        View full details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/renewal-planning?year=${year}
      `,
    }

    // TODO: Replace with actual email sending logic
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'Fleet Management <no-reply@yourdomain.com>',
    //   to: 'rostering-team@example.com',
    //   subject: emailContent.subject,
    //   text: emailContent.body,
    // })

    return NextResponse.json({
      success: true,
      message: 'Renewal plan email queued for sending',
      preview: emailContent,
      note: 'Email functionality not yet configured. Please set up an email service provider.',
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
