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
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import {
  getPilotRequestById,
  updateRequestStatus,
  updatePilotRequest,
  deletePilotRequest,
  WorkflowStatus,
} from '@/lib/services/unified-request-service'
import {
  RequestUpdateSchema,
  RequestStatusUpdateSchema,
} from '@/lib/validations/request-update-schema'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'

/**
 * GET /api/requests/[id]
 * Get single pilot request by ID
 */
export const GET = createAdminRoute(
  {
    operation: 'getPilotRequestById',
    endpoint: '/api/requests/[id]',
    rateLimit: { limiter: authRateLimit, by: 'ip' },
  },
  async ({ params }) => {
    const { id } = params

    // Get request
    const result = await getPilotRequestById(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  }
)

/**
 * PATCH /api/requests/[id]
 * Update request - supports both status updates and field updates
 *
 * Status Update Request Body:
 * {
 *   status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DENIED" | "WITHDRAWN"
 *   comments?: string (required for DENIED)
 * }
 *
 * Field Update Request Body:
 * {
 *   request_type?: string
 *   start_date?: string
 *   end_date?: string
 *   flight_date?: string
 *   reason?: string
 *   notes?: string
 *   source_reference?: string
 *   source_attachment_url?: string
 * }
 */
export const PATCH = createAdminRoute(
  {
    operation: 'updateRequest',
    endpoint: '/api/requests/[id]',
    rateLimit: { limiter: authRateLimit, by: 'ip' },
  },
  async ({ request, params, admin }) => {
    const { id } = params

    // Parse request body
    const body = await request.json()

    // Determine if this is a status update or field update
    const isStatusUpdate = 'status' in body

    if (isStatusUpdate) {
      // Status update flow
      const validationResult = RequestStatusUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error.issues[0]?.message || 'Invalid request data',
          },
          { status: 400 }
        )
      }

      const { status, comments } = validationResult.data

      // Update request status
      const result = await updateRequestStatus(id, status as WorkflowStatus, admin.userId, comments)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

      // Revalidate relevant paths
      revalidatePath('/dashboard/requests')
      revalidatePath(`/dashboard/requests/${id}`)
      revalidatePath('/dashboard/leave/approve')
      // Revalidate analytics and dashboard (status changes affect metrics)
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/dashboard/compliance')
      // Revalidate portal paths
      revalidatePath('/portal/leave-requests')
      revalidatePath('/portal/dashboard')

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Request status updated successfully',
      })
    } else {
      // Field update flow
      const validationResult = RequestUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error.issues[0]?.message || 'Invalid request data',
          },
          { status: 400 }
        )
      }

      // Transform null values to undefined for service compatibility
      const updateData = {
        ...validationResult.data,
        end_date: validationResult.data.end_date ?? undefined,
        flight_date: validationResult.data.flight_date ?? undefined,
        reason: validationResult.data.reason ?? undefined,
        notes: validationResult.data.notes ?? undefined,
        source_reference: validationResult.data.source_reference ?? undefined,
        source_attachment_url: validationResult.data.source_attachment_url ?? undefined,
      }

      // Update request fields
      const result = await updatePilotRequest(id, updateData)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

      // Revalidate relevant paths
      revalidatePath('/dashboard/requests')
      revalidatePath(`/dashboard/requests/${id}`)
      revalidatePath('/dashboard/leave/approve')

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Request updated successfully',
      })
    }
  }
)

/**
 * DELETE /api/requests/[id]
 * Delete a pilot request
 */
export const DELETE = createAdminRoute(
  {
    operation: 'deleteRequest',
    endpoint: '/api/requests/[id]',
    rateLimit: { limiter: authRateLimit, by: 'ip' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ params }) => {
    const { id } = params

    // Delete request using service layer
    const result = await deletePilotRequest(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete request' },
        { status: 500 }
      )
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/requests')

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
    })
  }
)
