/**
 * Pilots API Route
 * Handles pilot listing and creation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 *
 * @version 2.0.0
 * @updated 2025-10-27 - Added CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPilots, createPilot } from '@/lib/services/pilot-service'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/pilots
 * List all pilots with optional filters
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
    const role = searchParams.get('role') as 'Captain' | 'First Officer' | null
    const status = searchParams.get('status') as 'active' | 'inactive' | null

    // Fetch pilots
    const pilots = await getPilots({
      role: role || undefined,
      is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    })

    return NextResponse.json({
      success: true,
      data: pilots,
      count: pilots.length,
    })
  } catch (error) {
    console.error('GET /api/pilots error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPilots',
      endpoint: '/api/pilots'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/pilots
 * Create a new pilot
 * Protected by rate limiting (20 requests/min) and CSRF validation
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PilotCreateSchema.parse(body)

    // Create pilot
    const newPilot = await createPilot(validatedData)

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath('/dashboard')

    return NextResponse.json(
      {
        success: true,
        data: newPilot,
        message: 'Pilot created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/pilots error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('pilot data')
      return NextResponse.json(
        {
          ...formatApiError(validationError, 400),
          details: error.message,
        },
        { status: 400 }
      )
    }

    const sanitized = sanitizeError(error, {
      operation: 'createPilot',
      endpoint: '/api/pilots'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
