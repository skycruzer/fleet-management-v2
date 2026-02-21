/**
 * Leave Bid Service
 *
 * Service layer for annual leave bid operations.
 * Leave bids allow pilots to submit their preferred leave dates for a specific roster period.
 *
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication (via an_users table)
 *
 * DATABASE SCHEMA:
 * - roster_period_code: string (e.g., "RP13/2025")
 * - preferred_dates: string (JSON string of date ranges)
 * - alternative_dates: string | null (JSON string of alternative date ranges)
 * - priority: string (e.g., "HIGH", "MEDIUM", "LOW")
 * - reason: string
 * - status: string (PENDING, PROCESSING, APPROVED, REJECTED)
 *
 * @version 2.1.0
 * @updated 2026-01 - Use central ServiceResponse type
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { notifyAllAdmins } from '@/lib/services/notification-service'
import { sendAdminRequestNotificationEmail } from '@/lib/services/pilot-email-service'
import type { ServiceResponse } from '@/lib/types/service-response'

export interface LeaveBid {
  id: string
  pilot_id: string
  roster_period_code: string
  preferred_dates: string
  alternative_dates: string | null
  priority: string
  reason: string
  status: string | null
  notes: string | null
  review_comments: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  submitted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface LeaveBidInput {
  roster_period_code: string
  preferred_dates: string
  alternative_dates?: string | null
  priority: string
  reason: string
  notes?: string | null
}

// NOTE: Using central ServiceResponse type from @/lib/types/service-response

/**
 * Submit Leave Bid (Pilot Self-Service)
 *
 * Allows authenticated pilot to submit their leave bid for a roster period.
 * If a bid already exists for the period, it will be updated.
 *
 * @param bidData - Leave bid data
 * @returns Service response with created/updated bid
 */
export async function submitLeaveBid(bidData: LeaveBidInput): Promise<ServiceResponse<LeaveBid>> {
  try {
    const supabase = createAdminClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Validate bid data
    if (
      !bidData.roster_period_code ||
      !bidData.preferred_dates ||
      !bidData.priority ||
      !bidData.reason
    ) {
      return {
        success: false,
        error:
          'Invalid bid data: roster_period_code, preferred_dates, priority, and reason are required',
      }
    }

    // Check if bid already exists for this roster period
    const { data: existingBid, error: checkError } = await supabase
      .from('leave_bids')
      .select('id')
      .eq('pilot_id', pilot.pilot_id!)
      .eq('roster_period_code', bidData.roster_period_code)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing bid:', checkError)
      return {
        success: false,
        error: 'Failed to check existing bid',
      }
    }

    if (existingBid) {
      // Update existing bid
      const { data: updatedBid, error: updateError } = await supabase
        .from('leave_bids')
        .update({
          preferred_dates: bidData.preferred_dates,
          alternative_dates: bidData.alternative_dates,
          priority: bidData.priority,
          reason: bidData.reason,
          notes: bidData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBid.id)
        .select()
        .single()

      if (updateError || !updatedBid) {
        console.error('Error updating leave bid:', updateError)
        return {
          success: false,
          error: 'Failed to update leave bid',
        }
      }

      // Notify admins about updated leave bid (bell + email)
      notifyAllAdmins(
        'Leave Bid Updated',
        `${pilot.first_name} ${pilot.last_name} updated their leave bid for ${bidData.roster_period_code}`,
        'leave_bid_submitted',
        `/dashboard/admin/leave-bids/${updatedBid.id}`
      ).catch((err) => console.error('Failed to notify admins:', err))

      sendAdminRequestNotificationEmail({
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        requestCategory: 'LEAVE_BID',
        requestType: `Leave Bid (${bidData.priority})`,
        startDate: bidData.roster_period_code,
        endDate: null,
        requestId: updatedBid.id,
      }).catch((err) => console.error('Failed to send admin email:', err))

      return {
        success: true,
        data: updatedBid as LeaveBid,
      }
    } else {
      // Create new bid
      const { data: newBid, error: createError } = await supabase
        .from('leave_bids')
        .insert({
          pilot_id: pilot.pilot_id!,
          roster_period_code: bidData.roster_period_code,
          preferred_dates: bidData.preferred_dates,
          alternative_dates: bidData.alternative_dates,
          priority: bidData.priority,
          reason: bidData.reason,
          notes: bidData.notes,
          status: 'PENDING',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError || !newBid) {
        console.error('Error creating leave bid:', createError)
        return {
          success: false,
          error: 'Failed to create leave bid',
        }
      }

      // Notify admins about new leave bid (bell + email)
      notifyAllAdmins(
        'New Leave Bid Submitted',
        `${pilot.first_name} ${pilot.last_name} submitted a leave bid for ${bidData.roster_period_code}`,
        'leave_bid_submitted',
        `/dashboard/admin/leave-bids/${newBid.id}`
      ).catch((err) => console.error('Failed to notify admins:', err))

      sendAdminRequestNotificationEmail({
        pilotName: `${pilot.first_name} ${pilot.last_name}`,
        requestCategory: 'LEAVE_BID',
        requestType: `Leave Bid (${bidData.priority})`,
        startDate: bidData.roster_period_code,
        endDate: null,
        requestId: newBid.id,
      }).catch((err) => console.error('Failed to send admin email:', err))

      return {
        success: true,
        data: newBid as LeaveBid,
      }
    }
  } catch (error) {
    console.error('Submit leave bid error:', error)
    return {
      success: false,
      error: 'Failed to submit leave bid',
    }
  }
}

/**
 * Get All Leave Bids for Current Pilot
 *
 * Retrieves all leave bids submitted by the authenticated pilot.
 *
 * @returns Service response with array of leave bids
 */
export async function getCurrentPilotLeaveBids(): Promise<ServiceResponse<LeaveBid[]>> {
  try {
    const supabase = createAdminClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const { data, error } = await supabase
      .from('leave_bids')
      .select('*, leave_bid_options(*)')
      .eq('pilot_id', pilot.pilot_id!)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leave bids:', error)
      return {
        success: false,
        error: 'Failed to fetch leave bids',
      }
    }

    return {
      success: true,
      data: (data || []) as LeaveBid[],
    }
  } catch (error) {
    console.error('Get leave bids error:', error)
    return {
      success: false,
      error: 'Failed to fetch leave bids',
    }
  }
}

/**
 * Get Leave Bid by ID
 *
 * Retrieves a specific leave bid by ID (must belong to current pilot).
 *
 * @param bidId - Leave bid ID
 * @returns Service response with leave bid
 */
export async function getLeaveBidById(bidId: string): Promise<ServiceResponse<LeaveBid>> {
  try {
    const supabase = createAdminClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const { data, error } = await supabase
      .from('leave_bids')
      .select('*')
      .eq('id', bidId)
      .eq('pilot_id', pilot.pilot_id!)
      .single()

    if (error) {
      console.error('Error fetching leave bid:', error)
      return {
        success: false,
        error: 'Leave bid not found',
      }
    }

    return {
      success: true,
      data: data as LeaveBid,
    }
  } catch (error) {
    console.error('Get leave bid error:', error)
    return {
      success: false,
      error: 'Failed to fetch leave bid',
    }
  }
}

/**
 * Update Leave Bid (Pilot Self-Service)
 *
 * Allows authenticated pilot to update their pending leave bid.
 * Only PENDING bids can be edited - once processed, bids are locked.
 *
 * @param bidId - Leave bid ID to update
 * @param bidData - Updated leave bid data
 * @returns Service response with updated bid
 */
export async function updateLeaveBid(
  bidId: string,
  bidData: Partial<LeaveBidInput>
): Promise<ServiceResponse<LeaveBid>> {
  try {
    const supabase = createAdminClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify bid belongs to pilot and is pending
    const { data: existingBid, error: fetchError } = await supabase
      .from('leave_bids')
      .select('*')
      .eq('id', bidId)
      .eq('pilot_id', pilot.pilot_id!)
      .single()

    if (fetchError || !existingBid) {
      return {
        success: false,
        error: 'Leave bid not found',
      }
    }

    if (existingBid.status !== 'PENDING') {
      return {
        success: false,
        error: 'Only pending bids can be edited',
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (bidData.preferred_dates !== undefined) {
      updateData.preferred_dates = bidData.preferred_dates
    }
    if (bidData.alternative_dates !== undefined) {
      updateData.alternative_dates = bidData.alternative_dates
    }
    if (bidData.priority !== undefined) {
      updateData.priority = bidData.priority
    }
    if (bidData.reason !== undefined) {
      updateData.reason = bidData.reason
    }
    if (bidData.notes !== undefined) {
      updateData.notes = bidData.notes
    }
    if (bidData.roster_period_code !== undefined) {
      updateData.roster_period_code = bidData.roster_period_code
    }

    // Update the bid
    const { data: updatedBid, error: updateError } = await supabase
      .from('leave_bids')
      .update(updateData)
      .eq('id', bidId)
      .eq('pilot_id', pilot.pilot_id!)
      .select()
      .single()

    if (updateError || !updatedBid) {
      console.error('Error updating leave bid:', updateError)
      return {
        success: false,
        error: 'Failed to update leave bid',
      }
    }

    return {
      success: true,
      data: updatedBid as LeaveBid,
    }
  } catch (error) {
    console.error('Update leave bid error:', error)
    return {
      success: false,
      error: 'Failed to update leave bid',
    }
  }
}

/**
 * Cancel Leave Bid
 *
 * Allows pilot to cancel a pending leave bid.
 *
 * @param bidId - Leave bid ID to cancel
 * @returns Service response
 */
export async function cancelLeaveBid(bidId: string): Promise<ServiceResponse> {
  try {
    const supabase = createAdminClient()

    // Get current authenticated pilot
    const pilot = await getCurrentPilot()
    if (!pilot) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Verify bid belongs to pilot and is pending
    const { data: bid, error: fetchError } = await supabase
      .from('leave_bids')
      .select('id, status')
      .eq('id', bidId)
      .eq('pilot_id', pilot.pilot_id!)
      .single()

    if (fetchError || !bid) {
      return {
        success: false,
        error: 'Leave bid not found',
      }
    }

    if (bid.status !== 'PENDING') {
      return {
        success: false,
        error: 'Only pending bids can be cancelled',
      }
    }

    // Delete the bid
    const { error: deleteError } = await supabase
      .from('leave_bids')
      .delete()
      .eq('id', bidId)
      .eq('pilot_id', pilot.pilot_id!)

    if (deleteError) {
      console.error('Error cancelling leave bid:', deleteError)
      return {
        success: false,
        error: 'Failed to cancel leave bid',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Cancel leave bid error:', error)
    return {
      success: false,
      error: 'Failed to cancel leave bid',
    }
  }
}
