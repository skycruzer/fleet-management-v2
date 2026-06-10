/**
 * Leave Bid API Route (admin-side)
 * PATCH: Update leave bid details and status
 * DELETE: Remove a leave bid (admin only)
 *
 * @version 4.0.0 — security pipeline via createAdminRoute factory;
 *                  route only declares requirements + business logic
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { authRateLimit } from '@/lib/rate-limit'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import {
  adminUpdateLeaveBid,
  adminDeleteLeaveBid,
  type AdminLeaveBidUpdate,
} from '@/lib/services/leave-bid-service'
import { invalidateLeaveCaches } from '@/lib/services/cache-invalidation-helper'

export const dynamic = 'force-dynamic'

const UpdateLeaveBidSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  review_comments: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  reason: z.string().optional(),
  reviewed_at: z.string().nullable().optional(),
})

export const PATCH = createAdminRoute(
  {
    operation: 'updateLeaveBid',
    endpoint: '/api/admin/leave-bids/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    schema: UpdateLeaveBidSchema,
    invalidateCache: invalidateLeaveCaches,
    revalidate: ({ params }) => [
      '/dashboard/leave-bids',
      `/dashboard/leave-bids/${params.id}`,
      '/portal/leave-bids',
    ],
  },
  async ({ params, body }) => {
    const updates: AdminLeaveBidUpdate = {
      status: body.status,
      review_comments: body.review_comments,
      notes: body.notes,
      reason: body.reason,
      reviewed_at: body.reviewed_at,
    }

    const result = await adminUpdateLeaveBid(params.id, updates)

    if (!result.success) {
      const status = result.error === 'Leave bid not found' ? 404 : 500
      return NextResponse.json(
        { success: false, error: 'Failed to update leave bid', details: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leave bid updated successfully',
      data: result.data,
    })
  }
)

export const DELETE = createAdminRoute(
  {
    operation: 'deleteLeaveBid',
    endpoint: '/api/admin/leave-bids/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN],
    invalidateCache: invalidateLeaveCaches,
    revalidate: ['/dashboard/leave-bids', '/portal/leave-bids'],
  },
  async ({ params }) => {
    const result = await adminDeleteLeaveBid(params.id)

    if (!result.success) {
      const status = result.error === 'Leave bid not found' ? 404 : 500
      return NextResponse.json(
        { success: false, error: 'Failed to delete leave bid', details: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Leave bid deleted successfully',
    })
  }
)
