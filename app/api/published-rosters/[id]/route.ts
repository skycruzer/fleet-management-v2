// Maurice Rondeau — Published Roster Detail API
// GET: Roster with assignments | DELETE: Remove roster
// @updated 2026-06-10 - Migrated to createAdminRoute factory

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { invalidatePublishedRosterCaches } from '@/lib/services/cache-invalidation-helper'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  deletePublishedRoster,
  getPublishedRosterById,
} from '@/lib/services/published-roster-service'

export const GET = createAdminRoute(
  {
    operation: 'getPublishedRosterById',
    endpoint: '/api/published-rosters/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ params }) => {
    try {
      const { id } = params
      const result = await getPublishedRosterById(id)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        source: 'api/published-rosters/[id]/GET',
        severity: ErrorSeverity.HIGH,
      })
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
  }
)

export const DELETE = createAdminRoute(
  {
    operation: 'deletePublishedRoster',
    endpoint: '/api/published-rosters/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ params }) => {
    try {
      const { id } = params

      const result = await deletePublishedRoster(id)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

      await invalidatePublishedRosterCaches().catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

      return NextResponse.json({ success: true })
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        source: 'api/published-rosters/[id]/DELETE',
        severity: ErrorSeverity.HIGH,
      })
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
  }
)
