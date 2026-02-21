/**
 * Leave Bid Update API Route
 * Allows administrators to update leave bid details and status
 *
 * @version 2.0.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { authRateLimit } from '@/lib/rate-limit'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { revalidatePath } from 'next/cache'
import { adminDeleteLeaveBid } from '@/lib/services/leave-bid-service'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const { id } = await context.params

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status, review_comments, notes, reason, reviewed_at } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('leave_bids')
      .update({
        status,
        review_comments,
        notes,
        reason,
        reviewed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating leave bid:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update leave bid', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Leave bid not found' }, { status: 404 })
    }

    // Revalidate leave bid paths
    revalidatePath('/dashboard/leave-bids')
    revalidatePath(`/dashboard/leave-bids/${id}`)
    revalidatePath('/portal/leave-bids')

    return NextResponse.json({
      success: true,
      message: 'Leave bid updated successfully',
      data,
    })
  } catch (error: unknown) {
    console.error('Error in PATCH /api/admin/leave-bids/[id]:', error)
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
    // SECURITY: Validate CSRF token
    const csrfError = await validateCsrf(request)
    if (csrfError) return csrfError

    const { id } = await context.params

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting
    const { success: rateLimitSuccess } = await authRateLimit.limit(auth.userId!)
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Delete leave bid via service layer
    const result = await adminDeleteLeaveBid(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete leave bid' },
        { status: 404 }
      )
    }

    // Revalidate leave bid paths
    revalidatePath('/dashboard/admin/leave-bids')
    revalidatePath('/portal/leave-bids')

    return NextResponse.json({
      success: true,
      message: 'Leave bid deleted successfully',
    })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/admin/leave-bids/[id]:', error)
    const { id } = await context.params
    const sanitized = sanitizeError(error, {
      operation: 'deleteLeaveBid',
      resourceId: id,
      endpoint: '/api/admin/leave-bids/[id]',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
