/**
 * Admin Leave Bid Option Review API
 * Handles approval/rejection of individual leave bid preferences
 *
 * Developer: Maurice Rondeau
 *
 * Security pipeline (CSRF, auth, rate limiting) via createAdminRoute.
 *
 * @version 2.0.0
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { createNotification } from '@/lib/services/notification-service'
import {
  sendLeaveBidApprovedEmail,
  sendLeaveBidRejectedEmail,
} from '@/lib/services/pilot-email-notification-service'

const ReviewOptionSchema = z.object({
  bidId: z.string().min(1, 'Missing required fields: bidId, optionKey, and action'),
  optionKey: z.union([z.string(), z.number()]),
  action: z.enum(['approve', 'reject'], {
    message: 'Invalid action. Must be "approve" or "reject"',
  }),
})

export const POST = createAdminRoute(
  {
    operation: 'reviewLeaveBidOption',
    endpoint: '/api/admin/leave-bids/review-option',
    schema: ReviewOptionSchema,
  },
  async ({ body }) => {
    const { bidId, optionKey, action } = body

    const supabase = createAdminClient()

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
  }
)
