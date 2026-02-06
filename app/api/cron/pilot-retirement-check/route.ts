/**
 * Pilot Retirement Check Cron Job
 * Developer: Maurice Rondeau
 *
 * Runs daily at 5:00 AM to automatically retire pilots who have reached
 * the mandatory retirement age (default 65, configurable in settings).
 *
 * For each pilot at/past retirement age:
 * 1. Sets is_active = false
 * 2. Creates audit log entry
 * 3. Sends notification email (if email is configured)
 *
 * Schedule: Daily at 5:00 AM (configured in vercel.json)
 */

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { processRetiredPilots } from '@/lib/services/pilot-service'
import { sendRetirementNotificationEmail } from '@/lib/services/pilot-email-service'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify this is a cron job request (Vercel sets this header)
    // Use timing-safe comparison to prevent timing attacks on the bearer token
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`
    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ') ||
      authHeader.length !== expectedToken.length ||
      !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedToken))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get retirement age for email notifications
    const pilotReqs = await getPilotRequirements()
    const retirementAge = pilotReqs.pilot_retirement_age

    // Process retirements
    const processingResult = await processRetiredPilots()

    if (!processingResult?.results || !Array.isArray(processingResult.results)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unexpected response from retirement processor',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Send notification emails to retired pilots
    const emailResults: Array<{
      pilotId: string
      pilotName: string
      email: string | null
      emailSent: boolean
      error?: string
    }> = []

    for (const result of processingResult.results) {
      if (result.success && result.email) {
        const emailResult = await sendRetirementNotificationEmail({
          firstName: result.pilotName.split(' ')[0],
          lastName: result.pilotName.split(' ').slice(1).join(' ') || result.pilotName,
          email: result.email,
          rank: 'Pilot', // Could be enhanced to include actual rank
          employeeId: result.employeeId,
          retirementAge,
          currentAge: result.age,
          effectiveDate: format(new Date(), 'MMMM dd, yyyy'),
        })

        emailResults.push({
          pilotId: result.pilotId,
          pilotName: result.pilotName,
          email: result.email,
          emailSent: emailResult.success,
          error: emailResult.error,
        })

        if (emailResult.success) {
          processingResult.emailsSent++
        } else {
          processingResult.emailsFailed++
          console.error(
            `Failed to send retirement notification to ${result.email}:`,
            emailResult.error
          )
        }
      } else if (result.success && !result.email) {
        processingResult.skippedNoEmail++
        emailResults.push({
          pilotId: result.pilotId,
          pilotName: result.pilotName,
          email: null,
          emailSent: false,
          error: 'No email address on file',
        })
      }
    }

    // Build response
    const response = {
      success: true,
      message: 'Pilot retirement check completed',
      timestamp: new Date().toISOString(),
      retirementAge,
      summary: {
        totalChecked: processingResult.totalChecked,
        retired: processingResult.retired,
        skippedNoDOB: processingResult.skippedNoDOB,
        skippedNoEmail: processingResult.skippedNoEmail,
        emailsSent: processingResult.emailsSent,
        emailsFailed: processingResult.emailsFailed,
      },
      results: processingResult.results.map((r) => ({
        pilotId: r.pilotId,
        pilotName: r.pilotName,
        employeeId: r.employeeId,
        age: r.age,
        success: r.success,
        error: r.error,
        emailStatus: emailResults.find((e) => e.pilotId === r.pilotId),
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Pilot retirement cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
