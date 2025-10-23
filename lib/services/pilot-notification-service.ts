/**
 * Pilot Notification Service
 *
 * Handles pilot notifications for real-time updates and alerts.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'

// Type aliases for cleaner code
type PilotNotification = Database['public']['Tables']['notifications']['Row']
type PilotNotificationInsert = Database['public']['Tables']['notifications']['Insert']

/**
 * Service response type
 */
interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Notification type enum for type safety
 */
export enum NotificationType {
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_DENIED = 'leave_denied',
  FLIGHT_APPROVED = 'flight_approved',
  FLIGHT_DENIED = 'flight_denied',
  CERT_EXPIRING = 'certification_expiring',
  CERT_EXPIRED = 'certification_expired',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE = 'task_due_soon',
  REGISTRATION_APPROVED = 'registration_approved',
  REGISTRATION_DENIED = 'registration_denied',
  SYSTEM_ALERT = 'system_alert',
  GENERAL = 'general',
}

/**
 * Notification creation input
 */
interface CreateNotificationInput {
  recipient_id: string
  type: NotificationType | string
  title: string
  message: string
  link?: string
}

// ===================================
// NOTIFICATION CRUD OPERATIONS
// ===================================

/**
 * Create a new notification for a pilot
 *
 * @param notification - Notification data
 * @returns Service response with created notification
 */
export async function createNotification(
  notification: CreateNotificationInput
): Promise<ServiceResponse<PilotNotification>> {
  try {
    const supabase = await createClient()

    const notificationData: PilotNotificationInsert = {
      recipient_id: notification.recipient_id,
      recipient_type: 'pilot',
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      is_read: false,
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.NOTIFICATION_FAILED.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Create notification error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.NOTIFICATION_FAILED.message,
    }
  }
}

/**
 * Get all notifications for a pilot
 *
 * @param pilotId - Pilot ID
 * @param limit - Maximum number of notifications to return (default: 50)
 * @param unreadOnly - Return only unread notifications (default: false)
 * @returns Service response with notifications
 */
export async function getPilotNotifications(
  pilotId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<ServiceResponse<PilotNotification[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', pilotId)
      .eq('recipient_type', 'pilot')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('notifications').message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Get pilot notifications error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('notifications').message,
    }
  }
}

/**
 * Mark a notification as read
 *
 * @param notificationId - Notification ID
 * @param pilotId - Pilot ID (for verification)
 * @returns Service response
 */
export async function markNotificationAsRead(
  notificationId: string,
  pilotId: string
): Promise<ServiceResponse<PilotNotification>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', pilotId) // Ensure pilot owns this notification
      .eq('recipient_type', 'pilot')
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED.message,
    }
  }
}

/**
 * Mark all notifications as read for a pilot
 *
 * @param pilotId - Pilot ID
 * @returns Service response with count of updated notifications
 */
export async function markAllNotificationsAsRead(
  pilotId: string
): Promise<ServiceResponse<{ count: number }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', pilotId)
      .eq('recipient_type', 'pilot')
      .eq('is_read', false) // Only update unread ones
      .select('id')

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED.message,
      }
    }

    return {
      success: true,
      data: { count: data?.length || 0 },
    }
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.NOTIFICATION_UPDATE_FAILED.message,
    }
  }
}

/**
 * Delete a notification
 *
 * @param notificationId - Notification ID
 * @param pilotId - Pilot ID (for verification)
 * @returns Service response
 */
export async function deleteNotification(
  notificationId: string,
  pilotId: string
): Promise<ServiceResponse<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', pilotId) // Ensure pilot owns this notification
      .eq('recipient_type', 'pilot')

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.DELETE_FAILED('notification').message,
      }
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Delete notification error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.DELETE_FAILED('notification').message,
    }
  }
}

/**
 * Get unread notifications count for a pilot
 *
 * @param pilotId - Pilot ID
 * @returns Service response with unread count
 */
export async function getUnreadCount(pilotId: string): Promise<ServiceResponse<{ count: number }>> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', pilotId)
      .eq('recipient_type', 'pilot')
      .eq('is_read', false)

    if (error) {
      return {
        success: false,
        error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('unread count').message,
      }
    }

    return {
      success: true,
      data: { count: count || 0 },
    }
  } catch (error) {
    console.error('Get unread count error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.DATABASE.FETCH_FAILED('unread count').message,
    }
  }
}

// ===================================
// HELPER FUNCTIONS FOR CREATING SPECIFIC NOTIFICATIONS
// ===================================

/**
 * Send leave request approval notification
 *
 * @param pilotId - Pilot ID
 * @param leaveRequestId - Leave request ID
 * @param startDate - Leave start date
 * @param endDate - Leave end date
 * @returns Service response
 */
export async function notifyLeaveApproved(
  pilotId: string,
  leaveRequestId: string,
  startDate: string,
  endDate: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.LEAVE_APPROVED,
    title: 'Leave Request Approved',
    message: `Your leave request from ${startDate} to ${endDate} has been approved.`,
    link: `/portal/leave-requests/${leaveRequestId}`,
  })
}

/**
 * Send leave request denial notification
 *
 * @param pilotId - Pilot ID
 * @param leaveRequestId - Leave request ID
 * @param reason - Denial reason
 * @returns Service response
 */
export async function notifyLeaveDenied(
  pilotId: string,
  leaveRequestId: string,
  reason: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.LEAVE_DENIED,
    title: 'Leave Request Denied',
    message: `Your leave request was denied. Reason: ${reason}`,
    link: `/portal/leave-requests/${leaveRequestId}`,
  })
}

/**
 * Send flight request approval notification
 *
 * @param pilotId - Pilot ID
 * @param flightRequestId - Flight request ID
 * @param route - Flight route
 * @returns Service response
 */
export async function notifyFlightApproved(
  pilotId: string,
  flightRequestId: string,
  route: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.FLIGHT_APPROVED,
    title: 'Flight Request Approved',
    message: `Your flight request for route ${route} has been approved.`,
    link: `/portal/flight-requests/${flightRequestId}`,
  })
}

/**
 * Send flight request denial notification
 *
 * @param pilotId - Pilot ID
 * @param flightRequestId - Flight request ID
 * @param reason - Denial reason
 * @returns Service response
 */
export async function notifyFlightDenied(
  pilotId: string,
  flightRequestId: string,
  reason: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.FLIGHT_DENIED,
    title: 'Flight Request Denied',
    message: `Your flight request was denied. Reason: ${reason}`,
    link: `/portal/flight-requests/${flightRequestId}`,
  })
}

/**
 * Send certification expiring notification
 *
 * @param pilotId - Pilot ID
 * @param certName - Certification name
 * @param expiryDate - Expiry date
 * @param daysUntilExpiry - Days until expiry
 * @returns Service response
 */
export async function notifyCertExpiring(
  pilotId: string,
  certName: string,
  expiryDate: string,
  daysUntilExpiry: number
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.CERT_EXPIRING,
    title: 'Certification Expiring Soon',
    message: `Your ${certName} certification expires in ${daysUntilExpiry} days (${expiryDate}).`,
    link: `/portal/certifications`,
  })
}

/**
 * Send certification expired notification
 *
 * @param pilotId - Pilot ID
 * @param certName - Certification name
 * @param expiryDate - Expiry date
 * @returns Service response
 */
export async function notifyCertExpired(
  pilotId: string,
  certName: string,
  expiryDate: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.CERT_EXPIRED,
    title: 'Certification Expired',
    message: `Your ${certName} certification expired on ${expiryDate}. Please renew immediately.`,
    link: `/portal/certifications`,
  })
}

/**
 * Send task assigned notification
 *
 * @param pilotId - Pilot ID
 * @param taskId - Task ID
 * @param taskTitle - Task title
 * @returns Service response
 */
export async function notifyTaskAssigned(
  pilotId: string,
  taskId: string,
  taskTitle: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.TASK_ASSIGNED,
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${taskTitle}`,
    link: `/portal/tasks/${taskId}`,
  })
}

/**
 * Send registration approval notification
 *
 * @param pilotId - Pilot ID
 * @returns Service response
 */
export async function notifyRegistrationApproved(
  pilotId: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.REGISTRATION_APPROVED,
    title: 'Registration Approved',
    message: 'Your pilot registration has been approved. You can now access the portal.',
    link: `/portal/dashboard`,
  })
}

/**
 * Send registration denial notification
 *
 * @param pilotId - Pilot ID
 * @param reason - Denial reason
 * @returns Service response
 */
export async function notifyRegistrationDenied(
  pilotId: string,
  reason: string
): Promise<ServiceResponse<PilotNotification>> {
  return createNotification({
    recipient_id: pilotId,
    type: NotificationType.REGISTRATION_DENIED,
    title: 'Registration Denied',
    message: `Your pilot registration was denied. Reason: ${reason}`,
  })
}
