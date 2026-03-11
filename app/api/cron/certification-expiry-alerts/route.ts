/**
 * Certification Expiry Alerts Cron Job
 * Developer: Maurice Rondeau
 *
 * Runs daily at 6:00 AM to check for expiring certifications
 * and send bell notifications to pilots with portal accounts.
 *
 * Schedule: Daily at 6:00 AM (configured in vercel.json)
 */

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification, type NotificationType } from '@/lib/services/notification-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify this is a cron job request (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`
    if (
      !authHeader ||
      !process.env.CRON_SECRET ||
      authHeader.length !== expectedToken.length ||
      !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedToken))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get expiring certifications (within 90 days) for active pilots
    const today = new Date()
    const threshold = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

    const { data: expiringChecks, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        pilots!inner (
          id,
          first_name,
          last_name,
          rank,
          is_active
        ),
        check_types!inner (
          check_code,
          check_description
        )
      `
      )
      .not('expiry_date', 'is', null)
      .lte('expiry_date', threshold.toISOString().split('T')[0])
      .eq('pilots.is_active', true)
      .order('expiry_date', { ascending: true })

    if (error) {
      console.error('Error fetching expiring certifications:', error)
      return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
    }

    if (!expiringChecks || expiringChecks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expiring certifications',
        count: 0,
      })
    }

    // Group by pilot for consolidated bell notifications
    const certsByPilot: Record<
      string,
      {
        pilot: { first_name: string; last_name: string; rank: string }
        certifications: Array<{ checkCode: string; daysUntilExpiry: number }>
      }
    > = {}

    for (const check of expiringChecks) {
      const pilot = check.pilots as any
      const checkType = check.check_types as any
      const pilotId = pilot.id
      const daysUntilExpiry = Math.floor(
        (new Date(check.expiry_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (!certsByPilot[pilotId]) {
        certsByPilot[pilotId] = {
          pilot: {
            first_name: pilot.first_name,
            last_name: pilot.last_name,
            rank: pilot.rank,
          },
          certifications: [],
        }
      }

      certsByPilot[pilotId].certifications.push({
        checkCode: checkType.check_code || 'Unknown',
        daysUntilExpiry,
      })
    }

    // Resolve pilot portal user IDs for bell notifications
    const pilotIds = Object.keys(certsByPilot)
    const { data: userMappings } = await supabase
      .from('pilot_user_mappings')
      .select('pilot_id, pilot_user_id')
      .in('pilot_id', pilotIds)

    const pilotUserMap = new Map<string, string>()
    for (const mapping of userMappings || []) {
      if (mapping.pilot_id && mapping.pilot_user_id) {
        pilotUserMap.set(mapping.pilot_id, mapping.pilot_user_id)
      }
    }

    // Send bell notifications
    let bellNotificationsSent = 0
    let skippedNoPortalAccount = 0

    for (const pilotId of pilotIds) {
      const pilotUserId = pilotUserMap.get(pilotId)
      if (!pilotUserId) {
        skippedNoPortalAccount++
        continue
      }

      const { certifications } = certsByPilot[pilotId]
      const mostCritical = Math.min(...certifications.map((c) => c.daysUntilExpiry))

      const bellTitle =
        mostCritical < 0
          ? 'EXPIRED: Certification Action Required'
          : mostCritical <= 7
            ? 'URGENT: Certification Expiring in 7 Days'
            : mostCritical <= 14
              ? 'Certification Expiring in 14 Days'
              : 'Certification Expiring Soon'

      const bellType: NotificationType =
        mostCritical < 0 ? 'certification_expired' : 'certification_expiring'

      const certNames = certifications.map((c) => c.checkCode).join(', ')
      const bellMessage =
        mostCritical < 0
          ? `The following certification(s) have expired: ${certNames}. Please take immediate action.`
          : `${certNames} — expiring within ${mostCritical} days. Please schedule renewal.`

      createNotification({
        userId: pilotUserId,
        title: bellTitle,
        message: bellMessage,
        type: bellType,
        link: '/portal/certifications',
      }).catch((err) =>
        console.error(`Failed to create bell notification for pilot ${pilotId}:`, err)
      )

      bellNotificationsSent++
    }

    return NextResponse.json({
      success: true,
      message: 'Certification expiry bell notifications processed',
      summary: {
        totalPilotsWithExpiringCerts: pilotIds.length,
        bellNotificationsSent,
        skippedNoPortalAccount,
      },
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
