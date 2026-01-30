/**
 * Pilots API Route
 * Handles pilot listing and creation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: GET has per-user rate limiting, POST uses withRateLimit wrapper
 * HTTP CACHING: GET returns private, 5 minute cache (authenticated data)
 *
 * @version 2.3.0
 * @updated 2026-01 - Added rate limiting to GET, standardized response handling, HTTP caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPilots, createPilot } from '@/lib/services/pilot-service'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import {
  executeAndRespond,
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
  HTTP_STATUS,
} from '@/lib/utils/api-response-helper'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { getCacheHeadersPreset, getNoCacheHeaders } from '@/lib/utils/cache-headers'
import { invalidatePilotCaches } from '@/lib/services/cache-invalidation-helper'

/**
 * GET /api/pilots
 * List all pilots with optional filters
 *
 * RATE LIMITED: Per user rate limiting applied
 */
export async function GET(_request: NextRequest) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()

  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  // Rate limiting per authenticated user
  const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
  if (!rateLimitSuccess) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    )
  }

  // Get query parameters
  const searchParams = _request.nextUrl.searchParams
  const role = searchParams.get('role') as 'Captain' | 'First Officer' | null
  const status = searchParams.get('status') as 'active' | 'inactive' | null

  try {
    const pilots = await getPilots({
      role: role || undefined,
      is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: { pilots, count: pilots.length },
      },
      {
        headers: getCacheHeadersPreset('LIST_DATA'),
      }
    )
  } catch (error) {
    console.error('GET /api/pilots error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pilots',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pilots
 * Create a new pilot
 * Protected by rate limiting (20 requests/min) and CSRF validation
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  // CSRF Protection
  const csrfError = await validateCsrf(request)
  if (csrfError) {
    return csrfError
  }

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()

  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  // SECURITY: Verify user has Admin or Manager role to create pilots
  const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
  if (!roleCheck.authorized) {
    return forbiddenResponse('Admin or Manager role required to create pilots')
  }

  // Parse and validate request body
  let validatedData
  try {
    const body = await request.json()
    validatedData = PilotCreateSchema.parse(body)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return validationErrorResponse('Invalid pilot data', [
        { field: 'body', message: error.message },
      ])
    }
    throw error
  }

  try {
    const newPilot = await createPilot(validatedData)

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath('/dashboard')

    // Invalidate Redis caches - wrapped in try/catch to prevent request failures
    try {
      await invalidatePilotCaches()
    } catch (cacheError) {
      console.error('Cache invalidation failed (non-blocking):', cacheError)
    }

    return NextResponse.json(
      {
        success: true,
        data: newPilot,
      },
      {
        status: HTTP_STATUS.CREATED,
        headers: getNoCacheHeaders(),
      }
    )
  } catch (error) {
    console.error('POST /api/pilots error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create pilot',
      },
      { status: 500 }
    )
  }
})
