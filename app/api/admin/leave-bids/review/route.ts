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

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'
import { createNotification } from '@/lib/services/notification-service'
import {
  sendLeaveBidApprovedEmail,
  sendLeaveBidRejectedEmail,
} from '@/lib/services/pilot-email-notification-service'

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Check authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient()

    // Verify admin/manager role
    const { data: adminUser } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', auth.userId!)
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
      .select('id, roster_period_code, pilot_id, status, preferred_dates')
      .single()

    if (updateError) {
      console.error('Error updating leave bid:', updateError)
      return NextResponse.json(
        { success: false, error: `Failed to ${action} bid: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedBid) {
      return NextResponse.json({ success: false, error: 'Leave bid not found' }, { status: 404 })
    }

    // Send notification to pilot about bid status change
    const notificationType = action === 'approve' ? 'leave_bid_approved' : 'leave_bid_rejected'
    const notificationTitle = action === 'approve' ? 'Leave Bid Approved' : 'Leave Bid Rejected'
    const notificationMessage =
      action === 'approve'
        ? `Your leave bid for ${updatedBid.roster_period_code} has been approved.`
        : `Your leave bid for ${updatedBid.roster_period_code} has been rejected.`

    await createNotification({
      userId: updatedBid.pilot_id,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      link: `/portal/leave-bids`,
    })

    // Send email notification to pilot (fire-and-forget)
    const { data: pilotRecord } = await supabase
      .from('pilots')
      .select('email, first_name, last_name, role, employee_id')
      .eq('id', updatedBid.pilot_id)
      .single()

    if (pilotRecord?.email) {
      // Parse preferred_dates to extract preferences for email
      let preferences: Array<{ priority: number; startDate: string; endDate: string }> = []
      try {
        const parsed = JSON.parse((updatedBid.preferred_dates as string) || '[]')
        if (Array.isArray(parsed)) {
          preferences = parsed.map(
            (opt: { priority?: number; start_date?: string; end_date?: string }, idx: number) => ({
              priority: opt.priority || idx + 1,
              startDate: opt.start_date || '',
              endDate: opt.end_date || '',
            })
          )
        }
      } catch {
        // If parsing fails, send email without preferences
      }

      const pilotInfo = {
        email: pilotRecord.email,
        firstName: pilotRecord.first_name,
        lastName: pilotRecord.last_name,
        rank: (pilotRecord.role === 'Captain' ? 'Captain' : 'First Officer') as
          | 'Captain'
          | 'First Officer',
        employeeNumber: pilotRecord.employee_id,
      }

      const bidInfo = {
        id: updatedBid.id,
        rosterPeriodCode: updatedBid.roster_period_code,
        preferences,
      }

      const sendEmail = action === 'approve' ? sendLeaveBidApprovedEmail : sendLeaveBidRejectedEmail
      sendEmail(pilotInfo, bidInfo).catch((err) =>
        console.error('Failed to send leave bid email:', err)
      )
    }

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
      endpoint: '/api/admin/leave-bids/review',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
