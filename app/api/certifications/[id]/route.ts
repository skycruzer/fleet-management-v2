/**
 * Individual Certification API Route
 * Handles single certification operations (GET, PUT, DELETE)
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.2.0
 * @updated 2026-01 - Standardized response handling with api-response-helper
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCertificationById,
  updateCertification,
  deleteCertification,
} from '@/lib/services/certification-service'
import { CertificationUpdateSchema } from '@/lib/validations/certification-validation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { revalidatePath } from 'next/cache'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import {
  executeAndRespond,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  HTTP_STATUS,
} from '@/lib/utils/api-response-helper'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/certifications/[id]
 * Get a single certification by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  const { id } = await context.params

  return executeAndRespond(
    async () => {
      const certification = await getCertificationById(id)
      if (!certification) {
        throw Object.assign(new Error('Certification not found'), { statusCode: 404 })
      }
      return certification
    },
    {
      operation: 'getCertificationById',
      endpoint: `/api/certifications/${id}`,
    }
  )
}

/**
 * PUT /api/certifications/[id]
 * Update a certification
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  // Rate Limiting
  const identifier = getClientIp(request)
  const { success, reset } = await mutationRateLimit.limit(identifier)
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      },
      { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers: { 'Retry-After': retryAfter.toString() } }
    )
  }

  // CSRF Protection
  const csrfError = await validateCsrf(request)
  if (csrfError) {
    return csrfError
  }

  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  // SECURITY: Verify user has Admin or Manager role to update certifications
  const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
  if (!roleCheck.authorized) {
    return forbiddenResponse('Admin or Manager role required to update certifications')
  }

  const { id } = await context.params

  // Parse and validate request body
  let validatedData
  try {
    const body = await request.json()
    validatedData = CertificationUpdateSchema.parse(body)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return validationErrorResponse('Validation failed', [
        { field: 'body', message: error.message },
      ])
    }
    throw error
  }

  return executeAndRespond(
    async () => {
      const updatedCertification = await updateCertification(id, validatedData)

      if (!updatedCertification) {
        throw Object.assign(new Error('Certification not found'), { statusCode: 404 })
      }

      // Revalidate certification pages to clear Next.js cache
      revalidatePath('/dashboard/certifications')
      revalidatePath(`/dashboard/certifications/${id}`)
      revalidatePath(`/dashboard/certifications/${id}/edit`)

      // CRITICAL: Revalidate pilot detail page (where certifications are edited from)
      if (updatedCertification.pilot_id) {
        revalidatePath(`/dashboard/pilots/${updatedCertification.pilot_id}`)
      }

      // Also revalidate pilots list page to update certification counts
      revalidatePath('/dashboard/pilots')

      return updatedCertification
    },
    {
      operation: 'updateCertification',
      endpoint: `/api/certifications/${id}`,
    }
  )
}

/**
 * DELETE /api/certifications/[id]
 * Delete a certification
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  // Rate Limiting
  const identifier = getClientIp(request)
  const { success, reset } = await mutationRateLimit.limit(identifier)
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      },
      { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers: { 'Retry-After': retryAfter.toString() } }
    )
  }

  // CSRF Protection
  const csrfError = await validateCsrf(request)
  if (csrfError) {
    return csrfError
  }

  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    return unauthorizedResponse()
  }

  // SECURITY: Verify user has Admin or Manager role to delete certifications
  const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
  if (!roleCheck.authorized) {
    return forbiddenResponse('Admin or Manager role required to delete certifications')
  }

  const { id } = await context.params

  // Fetch certification before deleting to get pilot_id for cache invalidation
  const certification = await getCertificationById(id)
  if (!certification) {
    return notFoundResponse('Certification not found')
  }

  return executeAndRespond(
    async () => {
      await deleteCertification(id)

      // CRITICAL: Revalidate cache paths after deletion
      revalidatePath('/dashboard/certifications')
      revalidatePath(`/dashboard/certifications/${id}`)
      if (certification.pilot_id) {
        revalidatePath(`/dashboard/pilots/${certification.pilot_id}`)
      }
      revalidatePath('/dashboard/pilots')
      revalidatePath('/dashboard')

      return { deleted: true }
    },
    {
      operation: 'deleteCertification',
      endpoint: `/api/certifications/${id}`,
    }
  )
}
