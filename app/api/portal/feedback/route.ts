/**
 * Pilot Portal Feedback API Route
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 * AUTH: Explicit pilot authentication check at API layer
 *
 * @version 2.2.0
 * @updated 2026-01 - Added explicit auth guards and standardized responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitFeedback, getCurrentPilotFeedback } from '@/lib/services/pilot-feedback-service'
import { PilotFeedbackSchema } from '@/lib/validations/pilot-feedback-schema'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { unauthorizedResponse } from '@/lib/utils/api-response-helper'

/**
 * POST /api/portal/feedback
 *
 * Submit pilot feedback
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Read body once and handle potential stream errors
    let body: unknown
    try {
      body = await request.json()
    } catch (parseError: unknown) {
      console.error('POST /api/portal/feedback - JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body', errorCode: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Validate request body using safeParse for consistent error handling
    const validation = PilotFeedbackSchema.safeParse(body)

    if (!validation.success) {
      // Log detailed validation errors for debugging
      console.error('Zod validation errors:', JSON.stringify(validation.error.issues, null, 2))
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid feedback data',
          details: validation.error.issues,
          message: validation.error.issues[0]?.message || 'Validation failed',
        },
        { status: 400 }
      )
    }

    // Submit feedback
    const result = await submitFeedback(validation.data)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Revalidate cache for all affected paths
    revalidatePath('/portal/feedback')
    revalidatePath('/dashboard/feedback')

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    console.error('POST /api/portal/feedback error:', error)

    const sanitized = sanitizeError(error, {
      operation: 'submitFeedback',
      endpoint: '/api/portal/feedback',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})

/**
 * GET /api/portal/feedback
 *
 * Get pilot's own feedback submissions
 *
 * @auth Pilot Portal Authentication required (explicit check)
 */
export async function GET() {
  try {
    // SECURITY: Explicit authentication check at API layer
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return unauthorizedResponse('Pilot authentication required')
    }

    const result = await getCurrentPilotFeedback()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errorCode: 'FETCH_FAILED' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: unknown) {
    console.error('GET /api/portal/feedback error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getFeedback',
      endpoint: '/api/portal/feedback',
    })
    return NextResponse.json(
      { success: false, error: sanitized.error, errorId: sanitized.errorId },
      { status: sanitized.statusCode || 500 }
    )
  }
}
