/**
 * Admin Leave Bid Review API
 * Handles approval and rejection of pilot leave bids
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 3.0.0 - Refactored to use service layer
 * @updated 2025-11-09 - Service layer refactoring
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { reviewLeaveBid } from '@/lib/services/leave-bid-service'
import { revalidatePath } from 'next/cache'

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Verify admin/manager role
    const { data: adminUser } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      )
    }

    // Get request body
    const { bidId, action } = await request.json()

    // Validate request
    if (!bidId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bidId and action' },
        { status: 400 }
      )
    }

    // Use service layer for bid review
    const result = await reviewLeaveBid(bidId, action)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Leave bid not found' ? 404 : 500 }
      )
    }

    // Revalidate affected paths
    revalidatePath('/dashboard/admin/leave-bids')
    revalidatePath('/api/admin/leave-bids')

    // TODO: Send notification to pilot
    // This will be implemented when notification system is ready
    // await sendPilotNotification(updatedBid.pilot_id, {
    //   type: action === 'approve' ? 'LEAVE_BID_APPROVED' : 'LEAVE_BID_REJECTED',
    //   rosterPeriodCode: updatedBid.roster_period_code,
    //   bidId: updatedBid.id
    // })

    return NextResponse.json({
      success: true,
      message: `Leave bid ${action}d successfully`,
      data: result.data,
    })
  } catch (error: any) {
    const sanitized = sanitizeError(error, {
      operation: 'reviewLeaveBid',
      endpoint: '/api/admin/leave-bids/review'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
