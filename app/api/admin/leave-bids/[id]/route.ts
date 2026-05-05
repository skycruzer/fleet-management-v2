/**
 * Leave Bid API Route (admin-side)
 * PATCH: Update leave bid details and status
 * DELETE: Remove a leave bid (admin only)
 *
 * @version 3.0.0 — delegate to leave-bid-service; route only handles HTTP/auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { requireRole, UserRole } from '@/lib/middleware/authorization-middleware'
import {
  adminUpdateLeaveBid,
  adminDeleteLeaveBid,
  type AdminLeaveBidUpdate,
} from '@/lib/services/leave-bid-service'
import { invalidateLeaveCaches } from '@/lib/services/cache-invalidation-helper'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const { id } = await context.params

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error || 'Insufficient permissions' },
        { status: roleCheck.statusCode || 403 }
      )
    }

    const body = await request.json()
    const { status, review_comments, notes, reason, reviewed_at } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    const updates: AdminLeaveBidUpdate = {
      status,
      review_comments,
      notes,
      reason,
      reviewed_at,
    }

    const result = await adminUpdateLeaveBid(id, updates)

    if (!result.success) {
      const status = result.error === 'Leave bid not found' ? 404 : 500
      return NextResponse.json(
        { success: false, error: 'Failed to update leave bid', details: result.error },
        { status }
      )
    }

    await invalidateLeaveCaches()
    revalidatePath('/dashboard/leave-bids')
    revalidatePath(`/dashboard/leave-bids/${id}`)
    revalidatePath('/portal/leave-bids')

    return NextResponse.json({
      success: true,
      message: 'Leave bid updated successfully',
      data: result.data,
    })
  } catch (error: unknown) {
    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'updateLeaveBid',
      resourceId: id,
      endpoint: '/api/admin/leave-bids/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const { id } = await context.params

    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const roleCheck = await requireRole(request, [UserRole.ADMIN])
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error || 'Insufficient permissions' },
        { status: roleCheck.statusCode || 403 }
      )
    }

    const result = await adminDeleteLeaveBid(id)

    if (!result.success) {
      const status = result.error === 'Leave bid not found' ? 404 : 500
      return NextResponse.json(
        { success: false, error: 'Failed to delete leave bid', details: result.error },
        { status }
      )
    }

    await invalidateLeaveCaches()
    revalidatePath('/dashboard/leave-bids')
    revalidatePath('/portal/leave-bids')

    return NextResponse.json({
      success: true,
      message: 'Leave bid deleted successfully',
    })
  } catch (error: unknown) {
    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'deleteLeaveBid',
      resourceId: id,
      endpoint: '/api/admin/leave-bids/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
