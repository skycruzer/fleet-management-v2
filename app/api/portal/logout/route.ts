/**
 * Pilot Portal Logout API Route
 *
 * POST /api/portal/logout - Sign out pilot and clear session
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 * @spec 001-missing-core-features (US1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { pilotLogout } from '@/lib/services/pilot-portal-service'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Logout pilot
    const result = await pilotLogout()

    if (!result.success) {
      return NextResponse.json(
        formatApiError(
          {
            message: result.error || 'Logout failed',
            category: ERROR_MESSAGES.AUTH.SESSION_EXPIRED.category,
            severity: ERROR_MESSAGES.AUTH.SESSION_EXPIRED.severity,
          },
          500
        ),
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error: any) {
    console.error('Logout API error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'pilotLogout',
      endpoint: '/api/portal/logout'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
