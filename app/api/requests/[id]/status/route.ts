/**
 * Update Request Status API Endpoint
 *
 * PATCH /api/requests/[id]/status - Update workflow status of a pilot request
 *
 * CSRF PROTECTION: PATCH method validates CSRF token for defense-in-depth
 * RATE LIMITING: Inherits from admin API rate limits
 *
 * Security pipeline (CSRF, auth) via createAdminRoute.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateRequestStatus } from '@/lib/services/unified-request-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { logger } from '@/lib/services/logging-service'
import { invalidateRequestCaches } from '@/lib/services/cache-invalidation-helper'

export const PATCH = createAdminRoute(
  {
    operation: 'updateRequestStatus',
    endpoint: '/api/requests/[id]/status',
    rateLimit: false,
  },
  async ({ request, params, admin }) => {
    try {
      // Parse and validate request body
      const UpdateStatusSchema = z.object({
        status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED', 'WITHDRAWN']),
        comments: z.string().optional(),
        force: z.boolean().optional(),
      })

      const body = await request.json()
      const parsed = UpdateStatusSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.issues },
          { status: 400 }
        )
      }
      const { status, comments, force } = parsed.data

      // Update request status
      const { id } = params
      const result = await updateRequestStatus(id, status, admin.userId, comments, force)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // Log the action
      await logger.info('Request status updated', {
        source: 'api:requests:status:patch',
        requestId: id,
        newStatus: status,
        userId: admin.userId,
        comments,
      })

      // Revalidate affected paths
      await invalidateRequestCaches(id).catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } catch (error) {
      await logger.error('Failed to update request status', {
        source: 'api:requests:status:patch',
        error: error instanceof Error ? error.message : String(error),
      })

      return NextResponse.json(
        { success: false, error: 'Failed to update request status' },
        { status: 500 }
      )
    }
  }
)
