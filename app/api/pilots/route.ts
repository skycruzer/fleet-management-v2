/**
 * Pilots API Route
 * Handles pilot listing and creation
 *
 * Developer: Maurice Rondeau
 *
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 * HTTP CACHING: GET returns private, 5 minute cache (authenticated data)
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { getPilots, createPilot } from '@/lib/services/pilot-service'
import { PilotCreateSchema } from '@/lib/validations/pilot-validation'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { validationErrorResponse, HTTP_STATUS } from '@/lib/utils/api-response-helper'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { getCacheHeadersPreset, getNoCacheHeaders } from '@/lib/utils/cache-headers'
import { invalidatePilotCaches } from '@/lib/services/cache-invalidation-helper'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/pilots
 * List all pilots with optional filters
 *
 * RATE LIMITED: Per user rate limiting applied
 */
export const GET = createAdminRoute(
  {
    operation: 'getPilots',
    endpoint: '/api/pilots',
    rateLimit: { limiter: authRateLimit, by: 'user' },
  },
  async ({ request }) => {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
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
      const s = sanitizeError(error, { operation: 'getPilots', endpoint: '/api/pilots' })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)

/**
 * POST /api/pilots
 * Create a new pilot
 * Protected by rate limiting (20 requests/min) and CSRF validation
 */
export const POST = createAdminRoute(
  {
    operation: 'createPilot',
    endpoint: '/api/pilots',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to create pilots',
  },
  async ({ request }) => {
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

      // Invalidate pilot caches (Next.js paths + Redis) - non-blocking
      await invalidatePilotCaches().catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

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
      const s = sanitizeError(error, { operation: 'createPilot', endpoint: '/api/pilots' })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
