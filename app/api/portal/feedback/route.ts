/**
 * Pilot Portal Feedback API Route
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  submitFeedback,
  getCurrentPilotFeedback,
} from '@/lib/services/pilot-feedback-service'
import { PilotFeedbackSchema } from '@/lib/validations/pilot-feedback-schema'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

/**
 * POST /api/portal/feedback
 *
 * Submit pilot feedback
 *
 * @auth Pilot Portal Authentication required
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const body = await request.json()

    // Validate request body
    const validated = PilotFeedbackSchema.parse(body)

    // Submit feedback
    const result = await submitFeedback(validated)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    console.error('POST /api/portal/feedback error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
})

/**
 * GET /api/portal/feedback
 *
 * Get pilot's own feedback submissions
 *
 * @auth Pilot Portal Authentication required
 */
export async function GET() {
  try {
    const result = await getCurrentPilotFeedback()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('GET /api/portal/feedback error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
