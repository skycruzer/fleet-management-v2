/**
 * Unified Pilot Request Detail API Route
 * Get, update, or delete individual pilot request
 *
 * Developer: Maurice Rondeau
 * Date: November 11, 2025
 *
 * GET /api/requests/[id] - Get single request
 * PATCH /api/requests/[id] - Update request status
 * DELETE /api/requests/[id] - Delete request
 *
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPilotRequestById,
  updateRequestStatus,
  WorkflowStatus,
} from '@/lib/services/unified-request-service'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'
import { authRateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/requests/[id]
 * Get single pilot request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Get request
    const result = await getPilotRequestById(params.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('GET /api/requests/[id] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'getPilotRequestById',
      endpoint: '/api/requests/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * PATCH /api/requests/[id]
 * Update request workflow status
 *
 * Request Body:
 * {
 *   status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DENIED" | "WITHDRAWN"
 *   comments?: string (required for DENIED)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: status' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses: WorkflowStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'IN_REVIEW',
      'APPROVED',
      'DENIED',
      'WITHDRAWN',
    ]
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update request status
    const result = await updateRequestStatus(
      params.id,
      body.status,
      user.id,
      body.comments
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/requests')
    revalidatePath(`/dashboard/requests/${params.id}`)
    revalidatePath('/dashboard/leave-requests')
    revalidatePath('/dashboard/flight-requests')

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Request status updated successfully',
    })
  } catch (error) {
    console.error('PATCH /api/requests/[id] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'updateRequestStatus',
      endpoint: '/api/requests/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

/**
 * DELETE /api/requests/[id]
 * Delete a pilot request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIp(request)
    const { success } = await authRateLimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Delete request
    const { error } = await supabase
      .from('pilot_requests')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete request' },
        { status: 500 }
      )
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/leave-requests')
    revalidatePath('/dashboard/flight-requests')

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/requests/[id] error:', error)
    const sanitized = sanitizeError(error, {
      operation: 'deleteRequest',
      endpoint: '/api/requests/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
