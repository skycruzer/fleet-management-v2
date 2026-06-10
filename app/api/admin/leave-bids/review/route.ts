/**
 * Admin Leave Bid Review API
 * Handles approval and rejection of pilot leave bids
 *
 * Developer: Maurice Rondeau
 *
 * Security pipeline (CSRF, auth, rate limiting) via createAdminRoute.
 * Admin/manager access is enforced by getAuthenticatedAdmin inside the factory.
 *
 * @version 3.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { invalidateLeaveCaches } from '@/lib/services/cache-invalidation-helper'
import { createNotification } from '@/lib/services/notification-service'
import {
  sendLeaveBidApprovedEmail,
  sendLeaveBidRejectedEmail,
} from '@/lib/services/pilot-email-notification-service'

const ReviewBidSchema = z.object({
  bidId: z.string().min(1, 'Missing required fields: bidId and action'),
  action: z.enum(['approve', 'reject'], {
    message: 'Invalid action. Must be "approve" or "reject"',
  }),
})

export const POST = createAdminRoute(
  {
    operation: 'reviewLeaveBid',
    endpoint: '/api/admin/leave-bids/review',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    schema: ReviewBidSchema,
    invalidateCache: invalidateLeaveCaches,
    revalidate: ['/dashboard/admin/leave-bids', '/portal/leave-bids'],
  },
  async ({ body }) => {
    const { bidId, action } = body

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient()

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
  }
)
