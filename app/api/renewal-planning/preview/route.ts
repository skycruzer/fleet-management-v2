/**
 * API Route: Preview Renewal Plan Generation
 * POST /api/renewal-planning/preview
 *
 * Thin HTTP wrapper around `previewRenewalPlan` in
 * `renewal-planning-preview-service`. The route handles CSRF, auth, and
 * parameter sanitisation only — all algorithm and database access lives in
 * the service layer.
 *
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import {
  previewRenewalPlan,
  VALID_CATEGORIES,
} from '@/lib/services/renewal-planning-preview-service'

export const POST = createAdminRoute(
  {
    operation: 'previewRenewalPlan',
    endpoint: '/api/renewal-planning/preview',
    rateLimit: false,
  },
  async ({ request }) => {
    try {
      const body = await request.json().catch(() => ({}))
      const monthsAhead = Math.min(Math.max(Number(body.monthsAhead) || 12, 1), 24)
      const categories: string[] = Array.isArray(body.categories)
        ? body.categories
        : [...VALID_CATEGORIES]
      const checkCodes: string[] | undefined = Array.isArray(body.checkCodes)
        ? body.checkCodes
        : undefined
      const captainRoles: string[] | undefined = Array.isArray(body.captainRoles)
        ? body.captainRoles
        : undefined

      const data = await previewRenewalPlan({
        monthsAhead,
        categories,
        checkCodes,
        captainRoles,
      })

      return NextResponse.json({ success: true, data })
    } catch (error) {
      logError(error as Error, {
        source: 'RenewalPlanningPreviewAPI',
        severity: ErrorSeverity.MEDIUM,
        metadata: { operation: 'POST' },
      })

      const sanitized = sanitizeError(error, {
        operation: 'previewRenewalPlan',
        endpoint: '/api/renewal-planning/preview',
      })
      return NextResponse.json(
        { success: false, ...sanitized },
        { status: sanitized.statusCode || 500 }
      )
    }
  }
)
