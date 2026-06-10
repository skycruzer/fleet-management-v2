/**
 * Individual Certification API Route
 * Handles single certification operations (GET, PUT, DELETE)
 *
 * Developer: Maurice Rondeau
 *
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import {
  getCertificationById,
  updateCertification,
  deleteCertification,
} from '@/lib/services/certification-service'
import { CertificationUpdateSchema } from '@/lib/validations/certification-validation'
import { revalidatePath } from 'next/cache'
import { invalidateCertificationCaches } from '@/lib/services/cache-invalidation-helper'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import {
  executeAndRespond,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response-helper'
import { UserRole } from '@/lib/middleware/authorization-middleware'

/**
 * GET /api/certifications/[id]
 * Get a single certification by ID
 */
export const GET = createAdminRoute(
  {
    operation: 'getCertificationById',
    endpoint: '/api/certifications/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
    const { id } = params

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
)

/**
 * PUT /api/certifications/[id]
 * Update a certification
 */
export const PUT = createAdminRoute(
  {
    operation: 'updateCertification',
    endpoint: '/api/certifications/[id]',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to update certifications',
  },
  async ({ request, params }) => {
    const { id } = params

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

        // Invalidate certification caches (Next.js paths + Redis) - non-blocking
        await invalidateCertificationCaches({
          certificationId: id,
          pilotId: updatedCertification.pilot_id ?? undefined,
        }).catch((error) => console.error('Cache invalidation failed (non-blocking):', error))

        // Paths not covered by the helper: edit page + pilots list (certification counts)
        revalidatePath(`/dashboard/certifications/${id}/edit`)
        revalidatePath('/dashboard/pilots')

        return updatedCertification
      },
      {
        operation: 'updateCertification',
        endpoint: `/api/certifications/${id}`,
      }
    )
  }
)

/**
 * DELETE /api/certifications/[id]
 * Delete a certification
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deleteCertification',
    endpoint: '/api/certifications/[id]',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to delete certifications',
  },
  async ({ params }) => {
    const { id } = params

    // Fetch certification before deleting to get pilot_id for cache invalidation
    const certification = await getCertificationById(id)
    if (!certification) {
      return notFoundResponse('Certification not found')
    }

    return executeAndRespond(
      async () => {
        await deleteCertification(id)

        // Invalidate certification caches (Next.js paths + Redis) - non-blocking
        await invalidateCertificationCaches({
          certificationId: id,
          pilotId: certification.pilot_id ?? undefined,
        }).catch((error) => console.error('Cache invalidation failed (non-blocking):', error))

        // Pilots list page is not covered by the helper (certification counts)
        revalidatePath('/dashboard/pilots')

        return { deleted: true }
      },
      {
        operation: 'deleteCertification',
        endpoint: `/api/certifications/${id}`,
      }
    )
  }
)
