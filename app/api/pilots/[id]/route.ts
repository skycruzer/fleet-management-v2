/**
 * Pilot API Route - Individual Pilot Operations
 * Handles GET, PUT, DELETE requests for individual pilot operations
 *
 * Developer: Maurice Rondeau
 *
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 * AUTHORIZATION: PUT and DELETE require Admin or Manager role
 *
 * @version 3.0.0
 * @since 2025-10-20
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { getPilotById, updatePilot, deletePilot } from '@/lib/services/pilot-service'
import { invalidatePilotCaches } from '@/lib/services/cache-invalidation-helper'
import { PilotUpdateSchema } from '@/lib/validations/pilot-validation'
import { validationErrorResponse } from '@/lib/utils/api-response-helper'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'

/**
 * GET /api/pilots/[id]
 * Fetch a single pilot by ID with certification status and system settings
 */
export const GET = createAdminRoute(
  {
    operation: 'getPilotById',
    endpoint: '/api/pilots/[id]',
    rateLimit: false,
  },
  async ({ params }) => {
    const pilotId = params.id

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: 'Pilot ID is required', errorCode: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Fetch pilot and system settings in parallel
    const [pilot, requirements] = await Promise.all([getPilotById(pilotId), getPilotRequirements()])

    if (!pilot) {
      return NextResponse.json({ success: false, error: 'Pilot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: pilot,
      systemSettings: {
        pilot_retirement_age: requirements.pilot_retirement_age,
      },
    })
  }
)

/**
 * PUT /api/pilots/[id]
 * Update a pilot's information
 */
export const PUT = createAdminRoute(
  {
    operation: 'updatePilot',
    endpoint: '/api/pilots/[id]',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to update pilots',
  },
  async ({ request, params }) => {
    const pilotId = params.id

    if (!pilotId) {
      return NextResponse.json(
        { success: false, error: 'Pilot ID is required', errorCode: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let validatedData
    try {
      const body = await request.json()
      validatedData = PilotUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return validationErrorResponse('Invalid pilot data', [
          { field: 'body', message: error.message },
        ])
      }
      throw error
    }

    // Update pilot using service layer with validated data
    const updatedPilot = await updatePilot(pilotId, validatedData)

    // Invalidate pilot caches (Next.js paths + Redis) - non-blocking
    await invalidatePilotCaches(pilotId).catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot updated successfully',
    })
  }
)

/**
 * DELETE /api/pilots/[id]
 * Delete a pilot and all related records (atomic)
 *
 * SECURITY: Requires Admin or Manager role - regular authenticated users cannot delete pilots
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deletePilot',
    endpoint: '/api/pilots/[id]',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    forbiddenMessage: 'Admin or Manager role required to delete pilots',
  },
  async ({ params }) => {
    const pilotId = params.id

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Delete pilot using service layer (includes cascade deletion)
    await deletePilot(pilotId)

    // Invalidate pilot caches (Next.js paths + Redis) - non-blocking
    await invalidatePilotCaches(pilotId).catch((error) =>
      console.error('Cache invalidation failed (non-blocking):', error)
    )

    return NextResponse.json({
      success: true,
      message: 'Pilot deleted successfully',
    })
  }
)
