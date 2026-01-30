/**
 * Pilot API Route - Individual Pilot Operations
 * Handles GET, PUT, DELETE requests for individual pilot operations
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: PUT and DELETE methods require CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 * AUTHORIZATION: DELETE requires Admin or Manager role
 *
 * @version 2.3.0
 * @since 2025-10-20
 * @updated 2026-01 - Added role-based authorization for destructive operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getPilotById, updatePilot, deletePilot } from '@/lib/services/pilot-service'
import { PilotUpdateSchema } from '@/lib/validations/pilot-validation'
import { validationErrorResponse } from '@/lib/utils/api-response-helper'
import { getPilotRequirements } from '@/lib/services/admin-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import { unauthorizedResponse, forbiddenResponse } from '@/lib/utils/api-response-helper'

/**
 * GET /api/pilots/[id]
 * Fetch a single pilot by ID with certification status and system settings
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return unauthorizedResponse()
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

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
  } catch (error: any) {
    console.error('Error fetching pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'getPilotById',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PUT /api/pilots/[id]
 * Update a pilot's information
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset, remaining } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Verify authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return unauthorizedResponse()
    }

    // SECURITY: Verify user has Admin or Manager role to update pilots
    const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!roleCheck.authorized) {
      return forbiddenResponse('Admin or Manager role required to update pilots')
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

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

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath(`/dashboard/pilots/${pilotId}`)
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      data: updatedPilot,
      message: 'Pilot updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'updatePilot',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE /api/pilots/[id]
 * Delete a pilot and all related records (atomic)
 *
 * SECURITY: Requires Admin or Manager role - regular authenticated users cannot delete pilots
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate Limiting
    const identifier = getClientIp(request)
    const { success, limit, reset, remaining } = await mutationRateLimit.limit(identifier)
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }

    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Verify authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return unauthorizedResponse()
    }

    // SECURITY: Verify user has Admin or Manager role for destructive operations
    const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!roleCheck.authorized) {
      return forbiddenResponse('Admin or Manager role required to delete pilots')
    }

    // Get pilot ID from params (Next.js 15 requires await)
    const { id: pilotId } = await params

    if (!pilotId) {
      return NextResponse.json({ success: false, error: 'Pilot ID is required' }, { status: 400 })
    }

    // Delete pilot using service layer (includes cascade deletion)
    await deletePilot(pilotId)

    // Revalidate cache for pilot-related pages
    revalidatePath('/dashboard/pilots')
    revalidatePath(`/dashboard/pilots/${pilotId}`)
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      message: 'Pilot deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting pilot:', error)
    const { id: pilotId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'deletePilot',
      resourceId: pilotId,
      endpoint: '/api/pilots/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
