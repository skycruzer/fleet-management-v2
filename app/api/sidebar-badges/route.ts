/**
 * Sidebar Badges API Endpoint
 * Returns lightweight aggregation counts for sidebar badge display.
 *
 * The route is a thin wrapper over `getSidebarBadgeCounts` per the project's
 * service-layer rule. If any underlying query fails, the response carries
 * `degraded: true` so the UI can render an indicator instead of falsely
 * rendering empty backlog.
 *
 * Author: Maurice Rondeau
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getSidebarBadgeCounts } from '@/lib/services/sidebar-badges-service'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function GET() {
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getSidebarBadgeCounts()
    const counts = {
      pendingRequests: result.pendingRequests,
      expiredCertifications: result.expiredCertifications,
      expiringCertifications: result.expiringCertifications,
    }

    return NextResponse.json(
      {
        success: true,
        data: counts,
        ...(result.degraded ? { degraded: true, failures: result.failures } : {}),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      source: 'sidebar-badges:GET',
      severity: ErrorSeverity.MEDIUM,
    })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badge counts' },
      { status: 500 }
    )
  }
}
