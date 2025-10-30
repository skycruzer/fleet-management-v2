/**
 * Certification Expiry Alerts Cron Job - TEST VERSION
 *
 * This is a TEST version that only sends emails to mrondeau@airniugini.com.pg
 * Use this to test email delivery before enabling for all pilots.
 *
 * To test manually:
 * curl -X GET http://localhost:3000/api/cron/certification-expiry-alerts-test \
 *   -H "Authorization: Bearer ${CRON_SECRET}"
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCertificationExpiryAlert } from '@/lib/services/pilot-email-service'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

// TEST EMAIL - Only send alerts to this email address
const TEST_EMAIL = 'mrondeau@airniugini.com.pg'

export async function GET(request: Request) {
  try {
    // Verify this is a cron job request (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    console.log(`🧪 TEST MODE: Only sending emails to ${TEST_EMAIL}`)

    // Get all expiring certifications using database function
    // This bypasses the PostgREST relationship issues
    const { data: expiringChecks, error } = await supabase.rpc('get_expiring_certifications_with_email', {
      days_threshold: 90
    })

    if (error) {
      console.error('Error fetching expiring certifications:', error)
      return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
    }

    if (!expiringChecks || expiringChecks.length === 0) {
      console.log('✅ No expiring certifications found')
      return NextResponse.json({
        success: true,
        message: 'No expiring certifications',
        count: 0,
        testMode: true,
        testEmail: TEST_EMAIL,
      })
    }

    // Group certifications by pilot
    const certsByPilot = expiringChecks.reduce((acc: Record<string, any>, check: any) => {
      const pilotId = check.pilot_id
      if (!acc[pilotId]) {
        acc[pilotId] = {
          pilot: {
            first_name: check.first_name,
            last_name: check.last_name,
            rank: check.rank,
            employee_id: check.employee_id,
            email: check.email,
          },
          certifications: [],
        }
      }
      acc[pilotId].certifications.push({
        checkCode: check.check_code || 'Unknown',
        checkDescription: check.check_description || 'Unknown certification',
        expiryDate: format(new Date(check.expiry_date), 'MMM dd, yyyy'),
        daysUntilExpiry: check.days_until_expiry,
      })
      return acc
    }, {})

    // Send email alerts - TEST MODE: Only to test email
    const emailResults = []
    let skippedCount = 0

    for (const pilotId in certsByPilot) {
      const { pilot, certifications } = certsByPilot[pilotId]

      // Email is directly on pilot object now
      const pilotEmail = pilot.email

      if (!pilot || !pilotEmail) {
        console.warn(`Skipping pilot ${pilotId} - no email address`)
        skippedCount++
        continue
      }

      // TEST MODE: Skip all pilots except the test email
      if (pilotEmail !== TEST_EMAIL) {
        console.log(`⏭️  Skipping ${pilotEmail} (test mode - not test email)`)
        skippedCount++
        continue
      }

      // Determine urgency level based on most critical certification
      const mostCritical = Math.min(...certifications.map((c: any) => c.daysUntilExpiry))
      let urgencyLevel: 'critical' | 'warning' | 'notice'
      if (mostCritical < 0) {
        urgencyLevel = 'critical'
      } else if (mostCritical <= 30) {
        urgencyLevel = 'warning'
      } else {
        urgencyLevel = 'notice'
      }

      console.log(`📧 Sending TEST alert to ${pilotEmail}`)

      // Send email
      const emailResult = await sendCertificationExpiryAlert({
        firstName: pilot.first_name,
        lastName: pilot.last_name,
        email: pilotEmail,
        rank: pilot.rank,
        certifications,
        urgencyLevel,
      })

      emailResults.push({
        pilotId,
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        email: pilotEmail,
        certificationsCount: certifications.length,
        urgencyLevel,
        success: emailResult.success,
        error: emailResult.error,
      })

      if (!emailResult.success) {
        console.error(`❌ Failed to send alert to ${pilotEmail}:`, emailResult.error)
      } else {
        console.log(
          `✅ Sent ${urgencyLevel} alert to ${pilot.first_name} ${pilot.last_name} (${certifications.length} certs)`
        )
      }
    }

    // Summary
    const successCount = emailResults.filter(r => r.success).length
    const failureCount = emailResults.filter(r => !r.success).length

    console.log(`\n📧 Certification Expiry Alerts Summary (TEST MODE):`)
    console.log(`   Test Email: ${TEST_EMAIL}`)
    console.log(`   Total pilots with expiring certs: ${Object.keys(certsByPilot).length}`)
    console.log(`   Skipped (not test email): ${skippedCount}`)
    console.log(`   Emails sent: ${emailResults.length}`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${failureCount}`)

    return NextResponse.json({
      success: true,
      message: 'Certification expiry alerts processed (TEST MODE)',
      testMode: true,
      testEmail: TEST_EMAIL,
      summary: {
        totalPilotsInDatabase: Object.keys(certsByPilot).length,
        skippedNotTestEmail: skippedCount,
        emailsSent: emailResults.length,
        successful: successCount,
        failed: failureCount,
      },
      results: emailResults,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        testMode: true,
      },
      { status: 500 }
    )
  }
}
