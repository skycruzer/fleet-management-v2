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
import { z } from 'zod'
import { updateRequestStatus, deletePilotRequest } from '@/lib/services/unified-request-service'
import { mutationRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logger } from '@/lib/services/logging-service'
import { invalidateRequestCaches } from '@/lib/services/cache-invalidation-helper'

const BulkActionSchema = z.object({
  request_ids: z
    .array(z.string().uuid('Invalid request ID'))
    .min(1, 'must be non-empty array')
    .max(50, 'maximum 50 per bulk operation'),
  action: z.enum(['approve', 'deny', 'delete']),
  comments: z.string().max(2000).optional(),
})

type BulkActionRequest = z.infer<typeof BulkActionSchema>

export const POST = createAdminRoute(
  {
    operation: 'bulkRequestAction',
    endpoint: '/api/requests/bulk',
    rateLimit: { limiter: mutationRateLimit, by: 'user' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  async ({ request, admin }) => {
    try {
      // Parse and validate request body
      const rawBody = await request.json()
      const validation = BulkActionSchema.safeParse(rawBody)

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error.issues[0]?.message || 'Invalid bulk request payload',
          },
          { status: 400 }
        )
      }

      const { request_ids, action, comments }: BulkActionRequest = validation.data

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
          logger.error('Bulk request item action failed', {
            source: 'api:requests:bulk:post',
            requestId,
            action,
            error: error instanceof Error ? error.message : String(error),
          })
          errors.push({ id: requestId, error: 'Failed to process request' })
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
      await invalidateRequestCaches().catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

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
