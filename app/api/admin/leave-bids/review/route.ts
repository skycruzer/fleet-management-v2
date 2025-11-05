/**
 * Admin Leave Bid Review API
 * Handles approval and rejection of pilot leave bids
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
 *
 * @version 2.1.0
 * @updated 2025-10-27 - Added rate limiting
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

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

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Determine new status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // Update bid status
    const { data: updatedBid, error: updateError } = await supabase
      .from('leave_bids')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .select('id, roster_period_code, pilot_id, status')
      .single()

    if (updateError) {
      console.error('Error updating leave bid:', updateError)
      return NextResponse.json(
        { success: false, error: `Failed to ${action} bid: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedBid) {
      return NextResponse.json(
        { success: false, error: 'Leave bid not found' },
        { status: 404 }
      )
    }

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
      data: {
        bidId: updatedBid.id,
        status: updatedBid.status,
        rosterPeriodCode: updatedBid.roster_period_code,
      },
    })
  } catch (error: any) {
    console.error('Error in leave bid review API:', error)
    const sanitized = sanitizeError(error, {
      operation: 'reviewLeaveBid',
      endpoint: '/api/admin/leave-bids/review'
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
