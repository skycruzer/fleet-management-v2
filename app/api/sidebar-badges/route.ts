/**
 * Sidebar Badges API Endpoint
 * Returns lightweight aggregation counts for sidebar badge display
 *
 * Author: Maurice Rondeau
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Run both count queries in parallel for speed
    const [pendingResult, expiringResult] = await Promise.all([
      // Count pending requests (SUBMITTED + IN_REVIEW workflow_status)
      supabase
        .from('pilot_requests')
        .select('id', { count: 'exact', head: true })
        .in('workflow_status', ['SUBMITTED', 'IN_REVIEW']),

      // Count certifications expiring within 60 days or already expired
      supabase
        .from('pilot_checks')
        .select('id, expiry_date')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const pendingRequests = pendingResult.count ?? 0

    // Separate expired from expiring
    const now = new Date()
    let expiredCertifications = 0
    let expiringCertifications = 0

    if (expiringResult.data) {
      for (const cert of expiringResult.data) {
        if (cert.expiry_date) {
          const expiryDate = new Date(cert.expiry_date)
          if (expiryDate < now) {
            expiredCertifications++
          } else {
            expiringCertifications++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingRequests,
        expiringCertifications,
        expiredCertifications,
      },
    })
  } catch (error) {
    console.error('Failed to fetch sidebar badges:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badge counts' },
      { status: 500 }
    )
  }
}
