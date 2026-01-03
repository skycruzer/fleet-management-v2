/**
 * Certifications API Route
 * Handles certification listing and creation
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
import { getCertifications, createCertification } from '@/lib/services/certification-service'
import { CertificationCreateSchema } from '@/lib/validations/certification-validation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/certifications
 * List all certifications with optional filters
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
    const status = searchParams.get('status') as 'current' | 'expiring' | 'expired' | 'all' | null
    const pilotId = searchParams.get('pilotId')
    const checkTypeId = searchParams.get('checkTypeId')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Fetch certifications
    const result = await getCertifications(page, pageSize, {
      status: status || undefined,
      pilotId: pilotId || undefined,
      checkTypeId: checkTypeId || undefined,
      category: category || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result.certifications,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      },
    })
  } catch (error) {
    console.error('GET /api/certifications error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getCertifications',
      endpoint: '/api/certifications',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/certifications
 * Create a new certification
 */
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CertificationCreateSchema.parse(body)

    // Create certification
    const newCertification = await createCertification(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: newCertification,
        message: 'Certification created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/certifications error:', error)

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ERROR_MESSAGES.VALIDATION.INVALID_FORMAT('certification data')
      return NextResponse.json(
        {
          ...formatApiError(validationError, 400),
          details: error.message,
        },
        { status: 400 }
      )
    }

    const sanitized = sanitizeError(error, {
      operation: 'createCertification',
      endpoint: '/api/certifications',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
