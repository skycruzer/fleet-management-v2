/**
 * Admin Leave Bid Option Review API
 * Handles approval/rejection of individual leave bid preferences
 *
 * Developer: Maurice Rondeau
 *
 * CSRF PROTECTION: POST method requires CSRF token validation
 * RATE LIMITING: 20 mutation requests per minute per IP
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

    const supabase = createAdminClient()

    // Get request body
    const { bidId, optionKey, action } = await request.json()

    // Validate request
    if (!bidId || optionKey === undefined || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bidId, optionKey, and action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Fetch the current bid
    const { data: bid, error: fetchError } = await supabase
      .from('leave_bids')
      .select('id, roster_period_code, pilot_id, status, option_statuses, preferred_dates')
      .eq('id', bidId)
      .single()

    if (fetchError || !bid) {
      return NextResponse.json({ success: false, error: 'Leave bid not found' }, { status: 404 })
    }

    // Update option_statuses
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const currentStatuses = (bid.option_statuses as Record<string, string>) || {}
    const updatedStatuses = { ...currentStatuses, [String(optionKey)]: newStatus }

    // Update the bid
    const { error: updateError } = await supabase
      .from('leave_bids')
      .update({
        option_statuses: updatedStatuses,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)

    if (updateError) {
      console.error('Error updating option status:', updateError)
      return NextResponse.json(
        { success: false, error: `Failed to ${action} option: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Send notification to pilot
    const ordinal =
      Number(optionKey) === 0
        ? '1st'
        : Number(optionKey) === 1
          ? '2nd'
          : Number(optionKey) === 2
            ? '3rd'
            : `${Number(optionKey) + 1}th`
    const notificationTitle =
      action === 'approve' ? 'Leave Bid Preference Approved' : 'Leave Bid Preference Rejected'
    const notificationMessage =
      action === 'approve'
        ? `Your ${ordinal} preference for ${bid.roster_period_code} has been approved.`
        : `Your ${ordinal} preference for ${bid.roster_period_code} has been rejected.`

    await createNotification({
      userId: bid.pilot_id,
      title: notificationTitle,
      message: notificationMessage,
      type: action === 'approve' ? 'leave_bid_approved' : 'leave_bid_rejected',
      link: '/portal/leave-bids',
    })

    // Send email notification to pilot (fire-and-forget)
    const { data: pilotRecord } = await supabase
      .from('pilots')
      .select('email, first_name, last_name, role, employee_id')
      .eq('id', bid.pilot_id)
      .single()

    if (pilotRecord?.email) {
      // Parse the specific option being reviewed for the email
      let preferences: Array<{ priority: number; startDate: string; endDate: string }> = []
      try {
        const parsed = JSON.parse((bid.preferred_dates as string) || '[]')
        if (Array.isArray(parsed)) {
          const optIdx = Number(optionKey)
          if (parsed[optIdx]) {
            const opt = parsed[optIdx] as {
              priority?: number
              start_date?: string
              end_date?: string
            }
            preferences = [
              {
                priority: opt.priority || optIdx + 1,
                startDate: opt.start_date || '',
                endDate: opt.end_date || '',
              },
            ]
          }
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
        id: bid.id,
        rosterPeriodCode: bid.roster_period_code,
        preferences,
      }

      const sendEmail = action === 'approve' ? sendLeaveBidApprovedEmail : sendLeaveBidRejectedEmail
      sendEmail(pilotInfo, bidInfo).catch((err) =>
        console.error('Failed to send leave bid option email:', err)
      )
    }

    return NextResponse.json({
      success: true,
      message: `Option ${action}d successfully`,
      data: {
        bidId: bid.id,
        optionKey: String(optionKey),
        optionStatus: newStatus,
        allStatuses: updatedStatuses,
      },
    })
  } catch (error: any) {
    console.error('Error in leave bid option review API:', error)
    const sanitized = sanitizeError(error, {
      operation: 'reviewLeaveBidOption',
      endpoint: '/api/admin/leave-bids/review-option',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
})
