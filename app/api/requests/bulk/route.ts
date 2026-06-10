/**
 * Bulk Request Operations API Endpoint
 *
 * POST /api/requests/bulk - Perform bulk actions on multiple requests
 *
 * Security pipeline (CSRF, auth, rate limiting, roles) via createAdminRoute.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { updateRequestStatus, deletePilotRequest } from '@/lib/services/unified-request-service'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logger } from '@/lib/services/logging-service'
import { revalidatePath } from 'next/cache'

interface BulkActionRequest {
  request_ids: string[]
  action: 'approve' | 'deny' | 'delete'
  comments?: string
}

export const POST = createAdminRoute(
  {
    operation: 'bulkRequestAction',
    endpoint: '/api/requests/bulk',
    rateLimit: { limiter: mutationRateLimit, by: 'user' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ request, admin }) => {
    try {
      // Parse request body
      const body = (await request.json()) as BulkActionRequest
      const { request_ids, action, comments } = body

      // Validate input
      if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid request_ids - must be non-empty array' },
          { status: 400 }
        )
      }

      // Cap array size to prevent abuse
      if (request_ids.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Too many items - maximum 50 per bulk operation' },
          { status: 400 }
        )
      }

      if (!['approve', 'deny', 'delete'].includes(action)) {
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
      }

      // Perform bulk action
      let successCount = 0
      let failureCount = 0
      const errors: Array<{ id: string; error: string }> = []

      for (const requestId of request_ids) {
        try {
          if (action === 'delete') {
            // Delete request using service layer
            const result = await deletePilotRequest(requestId)

            if (result.success) {
              successCount++
            } else {
              failureCount++
              errors.push({ id: requestId, error: result.error || 'Unknown error' })
            }
          } else {
            // Update status (approve or deny)
            const newStatus = action === 'approve' ? 'APPROVED' : 'DENIED'
            const result = await updateRequestStatus(requestId, newStatus, admin.userId, comments)

            if (result.success) {
              successCount++
            } else {
              failureCount++
              errors.push({ id: requestId, error: result.error || 'Unknown error' })
            }
          }
        } catch (error) {
          failureCount++
          errors.push({
            id: requestId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      // Log the bulk action
      await logger.info('Bulk request action performed', {
        source: 'api:requests:bulk:post',
        action,
        totalRequests: request_ids.length,
        successCount,
        failureCount,
        userId: admin.userId,
      })

      // Revalidate paths
      revalidatePath('/dashboard/requests')

      return NextResponse.json({
        success: true,
        data: {
          action,
          total_count: request_ids.length,
          affected_count: successCount,
          success_count: successCount,
          failure_count: failureCount,
          errors: errors.length > 0 ? errors : undefined,
        },
      })
    } catch (error) {
      await logger.error('Failed to perform bulk action', {
        source: 'api:requests:bulk:post',
        error: error instanceof Error ? error.message : String(error),
      })

      return NextResponse.json(
        { success: false, error: 'Failed to perform bulk action' },
        { status: 500 }
      )
    }
  }
)
