/**
 * Certifications API Route
 * Handles certification listing and creation
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
import { getCertifications, createCertification } from '@/lib/services/certification-service'
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { validationErrorResponse, HTTP_STATUS } from '@/lib/utils/api-response-helper'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { getCacheHeadersPreset, getNoCacheHeaders } from '@/lib/utils/cache-headers'
import { invalidateCertificationCaches } from '@/lib/services/cache-invalidation-helper'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/certifications
 * List all certifications with optional filters
 */
export const GET = createAdminRoute(
  {
    operation: 'getCertifications',
    endpoint: '/api/certifications',
    rateLimit: false,
  },
  async ({ request }) => {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'current' | 'expiring' | 'expired' | 'all' | null
    const pilotId = searchParams.get('pilotId')
    const checkTypeId = searchParams.get('checkTypeId')
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50)
    )

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
      const s = sanitizeError(error, {
        operation: 'getCertifications',
        endpoint: '/api/certifications',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)

/**
 * POST /api/certifications
 * Create a new certification
 */
export const POST = createAdminRoute(
  {
    operation: 'createCertification',
    endpoint: '/api/certifications',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to create certifications',
  },
  async ({ request }) => {
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
      const s = sanitizeError(error, {
        operation: 'createCertification',
        endpoint: '/api/certifications',
      })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
