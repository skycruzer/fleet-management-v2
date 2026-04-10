/**
 * Leave Requests API Route
 * Handles leave request listing and creation
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
import { revalidatePath } from 'next/cache'
import {
  getAllLeaveRequests,
  createLeaveRequestServer,
  checkLeaveConflicts,
} from '@/lib/services/unified-request-service'
import { LeaveRequestCreateSchema } from '@/lib/validations/leave-validation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

/**
 * GET /api/leave-requests
 * List all leave requests with optional filters
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
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
  } catch (error) {
    console.error('GET /api/leave-requests error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getAllLeaveRequests',
      endpoint: '/api/leave-requests',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * POST /api/leave-requests
 * Create a new leave request
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
})
