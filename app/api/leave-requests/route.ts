/**
 * Leave Requests API Route
 * Handles leave request listing and creation
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * Security pipeline (CSRF, auth, rate limiting) via createAdminRoute.
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  getAllLeaveRequests,
  createLeaveRequestServer,
  checkLeaveConflicts,
} from '@/lib/services/unified-request-service'
import { LeaveRequestCreateSchema } from '@/lib/validations/leave-validation'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/leave-requests
 * List all leave requests with optional filters
 */
export const GET = createAdminRoute(
  {
    operation: 'getAllLeaveRequests',
    endpoint: '/api/leave-requests',
    rateLimit: false,
  },
  async ({ request }) => {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const pilotId = searchParams.get('pilotId')
    const status = searchParams.get('status')
    const rosterPeriod = searchParams.get('rosterPeriod')

    // For now, get all requests (can add filtering later)
    const result = await getAllLeaveRequests()

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Failed to fetch leave requests',
        },
        { status: 500 }
      )
    }

    // Apply client-side filters if provided
    let filteredRequests = result.data

    if (pilotId) {
      filteredRequests = filteredRequests.filter((req) => req.pilot_id === pilotId)
    }

    if (status) {
      filteredRequests = filteredRequests.filter((req) => req.workflow_status === status)
    }

    if (rosterPeriod) {
      filteredRequests = filteredRequests.filter((req) => req.roster_period === rosterPeriod)
    }

    return NextResponse.json({
      success: true,
      data: filteredRequests,
      count: filteredRequests.length,
    })
  }
)

/**
 * POST /api/leave-requests
 * Create a new leave request
 */
export const POST = createAdminRoute(
  {
    operation: 'createLeaveRequest',
    endpoint: '/api/leave-requests',
  },
  async ({ request }) => {
    try {
      // Parse and validate request body
      const body = await request.json()
      const validatedData = LeaveRequestCreateSchema.parse(body)

      // Check for conflicts before creating
      const conflictResult = await checkLeaveConflicts(
        validatedData.pilot_id,
        validatedData.start_date,
        validatedData.end_date
      )

      // Return conflicts as a warning, but allow creation
      // (Manager/Admin can still approve despite conflicts)
      const hasConflicts = conflictResult.success && conflictResult.data?.hasConflicts
      const conflicts = conflictResult.data?.conflicts ?? []

      // Create leave request
      const createResult = await createLeaveRequestServer(validatedData)

      if (!createResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: createResult.error ?? 'Failed to create leave request',
          },
          { status: 500 }
        )
      }

      // Revalidate cache for leave request pages
      revalidatePath('/dashboard/leave-requests')
      revalidatePath('/dashboard/requests')
      revalidatePath('/dashboard')

      return NextResponse.json(
        {
          success: true,
          data: createResult.data,
          message: 'Leave request created successfully',
          warnings: hasConflicts ? ['This request conflicts with existing leave dates'] : undefined,
          conflicts: hasConflicts ? conflicts : undefined,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/leave-requests error:', error)

      // Handle duplicate leave request errors
      if (error instanceof Error && error.name === 'DuplicateLeaveRequestError') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            errorType: 'duplicate',
          },
          { status: 409 } // 409 Conflict
        )
      }

      // Handle validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.message,
          },
          { status: 400 }
        )
      }

      const sanitized = sanitizeError(error, {
        operation: 'createLeaveRequest',
        endpoint: '/api/leave-requests',
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode })
    }
  }
)
