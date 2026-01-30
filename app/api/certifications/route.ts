/**
 * Certifications API Route
 * Handles certification listing and creation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 * HTTP CACHING: GET returns private, 5 minute cache (authenticated data)
 *
 * @version 2.3.0
 * @updated 2026-01 - Standardized response handling with api-response-helper, HTTP caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCertifications, createCertification } from '@/lib/services/certification-service'
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import {
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
  HTTP_STATUS,
} from '@/lib/utils/api-response-helper'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { getCacheHeadersPreset, getNoCacheHeaders } from '@/lib/utils/cache-headers'
import { invalidateCertificationCaches } from '@/lib/services/cache-invalidation-helper'

/**
 * GET /api/certifications
 * List all certifications with optional filters
 */
export async function GET(_request: NextRequest) {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()

  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  // Get query parameters
  const searchParams = _request.nextUrl.searchParams
  const status = searchParams.get('status') as 'current' | 'expiring' | 'expired' | 'all' | null
  const pilotId = searchParams.get('pilotId')
  const checkTypeId = searchParams.get('checkTypeId')
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')

  try {
    const result = await getCertifications(page, pageSize, {
      status: status || undefined,
      pilotId: pilotId || undefined,
      checkTypeId: checkTypeId || undefined,
      category: category || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          certifications: result.certifications,
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
          },
        },
      },
      {
        headers: getCacheHeadersPreset('LIST_DATA'),
      }
    )
  } catch (error) {
    console.error('GET /api/certifications error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch certifications',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/certifications
 * Create a new certification
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

  // SECURITY: Verify user has Admin or Manager role to create certifications
  const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
  if (!roleCheck.authorized) {
    return forbiddenResponse('Admin or Manager role required to create certifications')
  }

  // Parse and validate request body
  let validatedData
  try {
    const body = await request.json()
    validatedData = CertificationCreateSchema.parse(body)
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return validationErrorResponse('Invalid certification data', [
        { field: 'body', message: error.message },
      ])
    }
    throw error
  }

  try {
    const newCertification = await createCertification(validatedData)

    // Invalidate certification caches including Redis analytics
    await invalidateCertificationCaches()

    return NextResponse.json(
      {
        success: true,
        data: newCertification,
      },
      {
        status: HTTP_STATUS.CREATED,
        headers: getNoCacheHeaders(),
      }
    )
  } catch (error) {
    console.error('POST /api/certifications error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create certification',
      },
      { status: 500 }
    )
  }
})
