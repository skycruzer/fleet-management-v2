/**
 * Leave Requests API Route
 * Handles leave request listing and creation
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAllLeaveRequests,
  createLeaveRequestServer,
  checkLeaveConflicts,
} from '@/lib/services/leave-service'
import { LeaveRequestCreateSchema } from '@/lib/validations/leave-validation'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/leave-requests
 * List all leave requests with optional filters
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = _request.nextUrl.searchParams
    const pilotId = searchParams.get('pilotId')
    const status = searchParams.get('status')
    const rosterPeriod = searchParams.get('rosterPeriod')

    // For now, get all requests (can add filtering later)
    const requests = await getAllLeaveRequests()

    // Apply client-side filters if provided
    let filteredRequests = requests

    if (pilotId) {
      filteredRequests = filteredRequests.filter((req) => req.pilot_id === pilotId)
    }

    if (status) {
      filteredRequests = filteredRequests.filter((req) => req.status === status)
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leave requests',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leave-requests
 * Create a new leave request
 */
export async function POST(_request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = LeaveRequestCreateSchema.parse(body)

    // Check for conflicts before creating
    const conflicts = await checkLeaveConflicts(
      validatedData.pilot_id,
      validatedData.start_date,
      validatedData.end_date
    )

    // Return conflicts as a warning, but allow creation
    // (Manager/Admin can still approve despite conflicts)
    const hasConflicts = conflicts.length > 0

    // Create leave request
    const newRequest = await createLeaveRequestServer(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: newRequest,
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create leave request',
      },
      { status: 500 }
    )
  }
}
