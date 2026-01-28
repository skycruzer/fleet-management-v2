/**
 * Pilot Feedback Service
 *
 * Service layer for pilot feedback submissions.
 * Handles feedback submission, retrieval, and admin responses.
 *
 * @architecture Service Layer Pattern
 * @auth Pilot Portal Authentication (via an_users table)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import type {
  PilotFeedbackInput,
  FeedbackResponseInput,
  FeedbackStatusUpdate,
  FeedbackFilters,
} from '@/lib/validations/pilot-feedback-schema'

export interface Feedback {
  id: string
  pilot_id: string
  category: string
  subject: string
  message: string
  is_anonymous: boolean
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  admin_response?: string | null
  responded_by?: string | null
  responded_at?: string | null
  created_at: string
  updated_at: string
  pilot?: {
    first_name: string
    last_name: string
    role: string
    employee_id: string
  }
}

export interface ServiceResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit Feedback (Pilot)
 *
 * Allows authenticated pilot to submit feedback
 *
 * @param feedbackData - Feedback submission data
 * @returns Service response with created feedback
 */
export async function submitFeedback(
  feedbackData: PilotFeedbackInput
): Promise<ServiceResponse<Feedback>> {
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

    // Insert feedback
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table), NOT pilot.id (pilot_users table ID)
    const { data: feedback, error } = await supabase
      .from('pilot_feedback')
      .insert({
        pilot_id: pilot.pilot_id!,
        category: feedbackData.category,
        subject: feedbackData.subject,
        message: feedbackData.message,
        is_anonymous: feedbackData.is_anonymous || false,
        status: 'PENDING',
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting feedback:', error)
      return {
        success: false,
        error: 'Failed to submit feedback',
      }
    }

    return {
      success: true,
      data: feedback as Feedback,
    }
  } catch (error) {
    console.error('Submit feedback error:', error)
    return {
      success: false,
      error: 'Failed to submit feedback',
    }
  }
}

/**
 * Get Current Pilot's Feedback
 *
 * Retrieves all feedback submitted by the authenticated pilot
 */
export async function getCurrentPilotFeedback(): Promise<ServiceResponse<Feedback[]>> {
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

    // Fetch feedback
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table)
    const { data: feedback, error } = await supabase
      .from('pilot_feedback')
      .select('*')
      .eq('pilot_id', pilot.pilot_id!)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pilot feedback:', error)
      return {
        success: false,
        error: 'Failed to fetch feedback',
      }
    }

    return {
      success: true,
      data: (feedback || []) as Feedback[],
    }
  } catch (error) {
    console.error('Get pilot feedback error:', error)
    return {
      success: false,
      error: 'Failed to fetch feedback',
    }
  }
}

/**
 * Get Feedback by ID (Pilot)
 *
 * Retrieves single feedback item (pilot can only access their own)
 */
export async function getFeedbackById(feedbackId: string): Promise<ServiceResponse<Feedback>> {
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

    // Fetch feedback (ensure pilot owns it)
    // IMPORTANT: Use pilot.pilot_id (foreign key to pilots table)
    const { data: feedback, error } = await supabase
      .from('pilot_feedback')
      .select('*')
      .eq('id', feedbackId)
      .eq('pilot_id', pilot.pilot_id!)
      .single()

    if (error) {
      console.error('Error fetching feedback:', error)
      return {
        success: false,
        error: 'Feedback not found',
      }
    }

    return {
      success: true,
      data: feedback as Feedback,
    }
  } catch (error) {
    console.error('Get feedback error:', error)
    return {
      success: false,
      error: 'Failed to fetch feedback',
    }
  }
}

/**
 * Get All Feedback (Admin)
 *
 * Retrieves all feedback submissions with optional filters
 * Requires admin authentication
 */
export async function getAllFeedback(
  filters?: FeedbackFilters
): Promise<ServiceResponse<Feedback[]>> {
  try {
    const supabase = createAdminClient()

    // Build query
    let query = supabase.from('pilot_feedback').select(`
        *,
        pilot:pilots (
          first_name,
          last_name,
          role,
          employee_id
        )
      `)

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.pilot_id) {
      query = query.eq('pilot_id', filters.pilot_id)
    }
    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date)
    }
    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date)
    }
    if (filters?.search) {
      query = query.or(`subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
    }

    // Order by newest first
    query = query.order('created_at', { ascending: false })

    const { data: feedback, error } = await query

    if (error) {
      console.error('Error fetching all feedback:', error)
      return {
        success: false,
        error: 'Failed to fetch feedback',
      }
    }

    return {
      success: true,
      data: (feedback || []) as Feedback[],
    }
  } catch (error) {
    console.error('Get all feedback error:', error)
    return {
      success: false,
      error: 'Failed to fetch feedback',
    }
  }
}

/**
 * Update Feedback Status (Admin)
 *
 * Allows admin to update feedback status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  statusUpdate: FeedbackStatusUpdate
): Promise<ServiceResponse> {
  try {
    const supabase = createAdminClient()

    // Get current admin user
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
        status: statusUpdate.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating feedback status:', error)
      return {
        success: false,
        error: 'Failed to update feedback status',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Update feedback status error:', error)
    return {
      success: false,
      error: 'Failed to update feedback status',
    }
  }
}

/**
 * Add Admin Response to Feedback (Admin)
 *
 * Allows admin to respond to feedback
 */
export async function addAdminResponse(
  feedbackId: string,
  responseData: FeedbackResponseInput
): Promise<ServiceResponse> {
  try {
    const supabase = createAdminClient()

    // Get current admin user
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
        admin_response: responseData.response,
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
        error: 'Failed to add response',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Add admin response error:', error)
    return {
      success: false,
      error: 'Failed to add response',
    }
  }
}

/**
 * Get Feedback by Category (Admin)
 *
 * Retrieves feedback filtered by category
 */
export async function getFeedbackByCategory(
  category: string
): Promise<ServiceResponse<Feedback[]>> {
  return getAllFeedback({ category: category as any })
}

/**
 * Export Feedback to CSV (Admin)
 *
 * Generates CSV export of feedback data
 */
export async function exportFeedbackToCSV(
  filters?: FeedbackFilters
): Promise<ServiceResponse<string>> {
  try {
    const result = await getAllFeedback(filters)

    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Failed to fetch feedback for export',
      }
    }

    // Build CSV header
    const headers = [
      'ID',
      'Date',
      'Category',
      'Subject',
      'Message',
      'Status',
      'Pilot Name',
      'Rank',
      'Employee ID',
      'Admin Response',
      'Responded At',
    ]

    // Build CSV rows
    const rows = result.data.map((feedback) => [
      feedback.id,
      new Date(feedback.created_at).toISOString(),
      feedback.category,
      feedback.subject,
      feedback.message.replace(/"/g, '""'), // Escape quotes
      feedback.status,
      feedback.is_anonymous
        ? 'Anonymous'
        : `${feedback.pilot?.first_name} ${feedback.pilot?.last_name}`,
      feedback.is_anonymous ? '' : feedback.pilot?.role || '',
      feedback.is_anonymous ? '' : feedback.pilot?.employee_id || '',
      feedback.admin_response ? feedback.admin_response.replace(/"/g, '""') : '',
      feedback.responded_at ? new Date(feedback.responded_at).toISOString() : '',
    ])

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return {
      success: true,
      data: csvContent,
    }
  } catch (error) {
    console.error('Export feedback error:', error)
    return {
      success: false,
      error: 'Failed to export feedback',
    }
  }
}
