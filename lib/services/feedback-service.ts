/**
 * Admin Feedback Service
 *
 * Service layer for admin feedback management operations.
 * Handles feedback review, responses, status updates, and exports.
 *
 * @architecture Service Layer Pattern
 * @auth Admin Supabase Authentication
 * @developer Maurice Rondeau
 * @version 1.0.0
 */

import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import type { Database } from '@/types/supabase'
import { createNotification } from '@/lib/services/notification-service'

type PilotFeedback = Database['public']['Tables']['pilot_feedback']['Row']

export interface FeedbackWithPilot extends PilotFeedback {
  pilot?: {
    first_name: string
    last_name: string
    role: string
    employee_id: string
  }
  responded_by_user?: {
    first_name: string
    last_name: string
  }
}

export interface FeedbackFilters {
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' | 'all'
  category?: string
  search?: string
  startDate?: string
  endDate?: string
}

export interface FeedbackStats {
  total: number
  pending: number
  reviewed: number
  resolved: number
  dismissed: number
  byCategory: Record<string, number>
}

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get All Feedback (Admin)
 *
 * Retrieves all pilot feedback with optional filters
 *
 * @param filters - Optional filters for status, category, date range
 * @returns Service response with feedback array
 */
export async function getAllFeedback(
  filters?: FeedbackFilters
): Promise<ServiceResponse<FeedbackWithPilot[]>> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Build query
    let query = supabase
      .from('pilot_feedback')
      .select(
        `
        *,
        pilot:pilots!pilot_feedback_pilot_id_fkey (
          first_name,
          last_name,
          role,
          employee_id
        )
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(
        `subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`
      )
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.FETCH_FAILED.message,
      }
    }

    return {
      success: true,
      data: data as FeedbackWithPilot[],
    }
  } catch (error) {
    console.error('Error in getAllFeedback:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.FETCH_FAILED.message,
    }
  }
}

/**
 * Get Feedback By ID (Admin)
 *
 * Retrieves single feedback submission with full details
 *
 * @param feedbackId - Feedback UUID
 * @returns Service response with feedback details
 */
export async function getFeedbackById(
  feedbackId: string
): Promise<ServiceResponse<FeedbackWithPilot>> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const { data, error } = await supabase
      .from('pilot_feedback')
      .select(
        `
        *,
        pilot:pilots!pilot_feedback_pilot_id_fkey (
          first_name,
          last_name,
          role,
          employee_id
        )
      `
      )
      .eq('id', feedbackId)
      .single()

    if (error) {
      console.error('Error fetching feedback:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.NOT_FOUND.message,
      }
    }

    return {
      success: true,
      data: data as FeedbackWithPilot,
    }
  } catch (error) {
    console.error('Error in getFeedbackById:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.NOT_FOUND.message,
    }
  }
}

/**
 * Get Feedback Stats (Admin)
 *
 * Returns statistics about feedback submissions
 *
 * @returns Service response with feedback statistics
 */
export async function getFeedbackStats(): Promise<
  ServiceResponse<FeedbackStats>
> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get all feedback
    const { data, error } = await supabase
      .from('pilot_feedback')
      .select('status, category')

    if (error) {
      console.error('Error fetching feedback stats:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.FETCH_FAILED.message,
      }
    }

    // Calculate stats
    const stats: FeedbackStats = {
      total: data.length,
      pending: data.filter((f) => f.status === 'PENDING').length,
      reviewed: data.filter((f) => f.status === 'REVIEWED').length,
      resolved: data.filter((f) => f.status === 'RESOLVED').length,
      dismissed: data.filter((f) => f.status === 'DISMISSED').length,
      byCategory: {},
    }

    // Count by category
    data.forEach((f) => {
      stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1
    })

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    console.error('Error in getFeedbackStats:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.FETCH_FAILED.message,
    }
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update Feedback Status (Admin)
 *
 * Updates feedback status (PENDING → REVIEWED → RESOLVED → DISMISSED)
 *
 * @param feedbackId - Feedback UUID
 * @param status - New status
 * @returns Service response
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    const { error } = await supabase
      .from('pilot_feedback')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating feedback status:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.UPDATE_FAILED.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateFeedbackStatus:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.UPDATE_FAILED.message,
    }
  }
}

/**
 * Add Admin Response (Admin)
 *
 * Adds admin response to feedback and marks as REVIEWED
 *
 * @param feedbackId - Feedback UUID
 * @param response - Admin response text
 * @returns Service response
 */
export async function addAdminResponse(
  feedbackId: string,
  response: string
): Promise<ServiceResponse> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // First, get the feedback to find the pilot_id and subject
    const { data: feedbackData, error: fetchError } = await supabase
      .from('pilot_feedback')
      .select('pilot_id, subject, is_anonymous')
      .eq('id', feedbackId)
      .single()

    if (fetchError || !feedbackData) {
      console.error('Error fetching feedback:', fetchError)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.NOT_FOUND.message,
      }
    }

    // Update the feedback with admin response
    const { error } = await supabase
      .from('pilot_feedback')
      .update({
        admin_response: response,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        status: 'REVIEWED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error adding admin response:', error)
      return {
        success: false,
        error: ERROR_MESSAGES.FEEDBACK.RESPONSE_FAILED.message,
      }
    }

    // Send notification to pilot about the response
    // Note: Only send if not anonymous
    // TODO: Add 'feedback_response_received' to database notification_type enum
    // if (!feedbackData.is_anonymous && feedbackData.pilot_id) {
    //   await createNotification({
    //     userId: feedbackData.pilot_id,
    //     title: 'Feedback Response Received',
    //     message: `An administrator has responded to your feedback: "${feedbackData.subject}"`,
    //     type: 'feedback_response_received',
    //     link: '/portal/feedback',
    //   })
    // }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in addAdminResponse:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.RESPONSE_FAILED.message,
    }
  }
}

// ============================================================================
// EXPORT OPERATIONS
// ============================================================================

/**
 * Export Feedback to CSV (Admin)
 *
 * Exports all feedback matching filters to CSV format
 *
 * @param filters - Optional filters
 * @returns Service response with CSV string
 */
export async function exportFeedbackToCSV(
  filters?: FeedbackFilters
): Promise<ServiceResponse<string>> {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED.message,
      }
    }

    // Get filtered feedback
    const feedbackResponse = await getAllFeedback(filters)
    if (!feedbackResponse.success || !feedbackResponse.data) {
      return {
        success: false,
        error: feedbackResponse.error,
      }
    }

    // Build CSV
    const headers = [
      'ID',
      'Date',
      'Pilot',
      'Employee ID',
      'Category',
      'Subject',
      'Message',
      'Status',
      'Anonymous',
      'Admin Response',
      'Responded At',
    ]

    const rows = feedbackResponse.data.map((f) => [
      f.id,
      new Date(f.created_at).toISOString(),
      f.is_anonymous
        ? 'Anonymous'
        : `${f.pilot?.first_name} ${f.pilot?.last_name}`,
      f.is_anonymous ? 'N/A' : f.pilot?.employee_id || '',
      f.category,
      f.subject,
      f.message.replace(/"/g, '""'), // Escape quotes
      f.status,
      f.is_anonymous ? 'Yes' : 'No',
      f.admin_response?.replace(/"/g, '""') || '',
      f.responded_at ? new Date(f.responded_at).toISOString() : '',
    ])

    const csv =
      headers.map((h) => `"${h}"`).join(',') +
      '\n' +
      rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')

    return {
      success: true,
      data: csv,
    }
  } catch (error) {
    console.error('Error exporting feedback:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.FEEDBACK.EXPORT_FAILED.message,
    }
  }
}
