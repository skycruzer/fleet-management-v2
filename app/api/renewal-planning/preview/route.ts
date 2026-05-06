/**
 * API Route: Preview Renewal Plan Generation
 * POST /api/renewal-planning/preview
 *
 * Thin HTTP wrapper around `previewRenewalPlan` in
 * `renewal-planning-preview-service`. The route handles CSRF, auth, and
 * parameter sanitisation only — all algorithm and database access lives in
 * the service layer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import {
  previewRenewalPlan,
  VALID_CATEGORIES,
} from '@/lib/services/renewal-planning-preview-service'

export async function POST(request: NextRequest) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate preview',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
