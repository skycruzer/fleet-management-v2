/**
 * Notification Service
 *
 * Handles creation, retrieval, and management of in-app notifications
 * for both admin and pilot users.
 *
 * @module services/notification-service
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/services/logging-service'
import { ErrorSeverity } from '@/lib/utils/error-messages'
import type { Database } from '@/types/supabase'

export type NotificationType = Database['public']['Enums']['notification_type']

export interface Notification {
  id: string
  recipient_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean | null
  created_at: string | null
  link?: string | null
  updated_at?: string | null
}

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  link?: string | null
}

export interface NotificationResult {
  success: boolean
  data?: Notification | Notification[]
  error?: string
}

/**
 * Create a new notification for a user
 *
 * @param params - Notification creation parameters
 * @returns Promise with success status and notification data
 *
 * @example
 * ```typescript
 * const result = await createNotification({
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   title: 'Leave Request Approved',
 *   message: 'Your leave request for RP5/2026 has been approved.',
 *   type: 'success',
 *   metadata: { leaveRequestId: '...' }
 * })
 * ```
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link || null,
        read: false,
      })
      .select()
      .single()

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.WARNING,
        metadata: { operation: 'createNotification', params },
      })
      return {
        success: false,
        error: 'Failed to create notification',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.ERROR,
      metadata: { operation: 'createNotification', params },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create notifications for multiple users at once
 *
 * @param notifications - Array of notification creation parameters
 * @returns Promise with success status and created notifications
 *
 * @example
 * ```typescript
 * const result = await createBulkNotifications([
 *   {
 *     userId: 'admin-uuid',
 *     title: 'New Leave Request',
 *     message: 'Pilot John Doe submitted a leave request',
 *     type: 'info'
 *   },
 *   {
 *     userId: 'manager-uuid',
 *     title: 'New Leave Request',
 *     message: 'Pilot John Doe submitted a leave request',
 *     type: 'info'
 *   }
 * ])
 * ```
 */
export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const notificationsToInsert = notifications.map((n) => ({
      recipient_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link || null,
      read: false,
    }))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)
      .select()

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.WARNING,
        metadata: { operation: 'createBulkNotifications', count: notifications.length },
      })
      return {
        success: false,
        error: 'Failed to create bulk notifications',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.ERROR,
      metadata: { operation: 'createBulkNotifications', count: notifications.length },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all notifications for a user
 *
 * @param userId - User ID to fetch notifications for
 * @param unreadOnly - If true, only return unread notifications
 * @returns Promise with success status and notifications array
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly = false
): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.WARNING,
        metadata: { operation: 'getUserNotifications', userId, unreadOnly },
      })
      return {
        success: false,
        error: 'Failed to fetch notifications',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.ERROR,
      metadata: { operation: 'getUserNotifications', userId, unreadOnly },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Mark a notification as read
 *
 * @param notificationId - ID of the notification to mark as read
 * @returns Promise with success status
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.INFO,
        metadata: { operation: 'markNotificationAsRead', notificationId },
      })
      return {
        success: false,
        error: 'Failed to mark notification as read',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.WARNING,
      metadata: { operation: 'markNotificationAsRead', notificationId },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Mark all notifications as read for a user
 *
 * @param userId - User ID whose notifications should be marked as read
 * @returns Promise with success status
 */
export async function markAllNotificationsAsRead(userId: string): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false)
      .select()

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.INFO,
        metadata: { operation: 'markAllNotificationsAsRead', userId },
      })
      return {
        success: false,
        error: 'Failed to mark all notifications as read',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.WARNING,
      metadata: { operation: 'markAllNotificationsAsRead', userId },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a notification
 *
 * @param notificationId - ID of the notification to delete
 * @returns Promise with success status
 */
export async function deleteNotification(notificationId: string): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.INFO,
        metadata: { operation: 'deleteNotification', notificationId },
      })
      return {
        success: false,
        error: 'Failed to delete notification',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.WARNING,
      metadata: { operation: 'deleteNotification', notificationId },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete all read notifications for a user
 *
 * @param userId - User ID whose read notifications should be deleted
 * @returns Promise with success status
 */
export async function deleteReadNotifications(userId: string): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId)
      .eq('read', true)

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.INFO,
        metadata: { operation: 'deleteReadNotifications', userId },
      })
      return {
        success: false,
        error: 'Failed to delete read notifications',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.WARNING,
      metadata: { operation: 'deleteReadNotifications', userId },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get unread notification count for a user
 *
 * @param userId - User ID to count unread notifications for
 * @returns Promise with success status and count
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)

    if (error) {
      logger.error((error as Error).message, {
        source: 'NotificationService',
        severity: ErrorSeverity.INFO,
        metadata: { operation: 'getUnreadNotificationCount', userId },
      })
      return {
        success: false,
        error: 'Failed to get unread notification count',
      }
    }

    return {
      success: true,
      count: count || 0,
    }
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.WARNING,
      metadata: { operation: 'getUnreadNotificationCount', userId },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Helper function to notify all admins
 *
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Notification type
 * @param metadata - Optional metadata
 * @returns Promise with success status
 *
 * @example
 * ```typescript
 * await notifyAllAdmins(
 *   'New Leave Request',
 *   'Pilot John Doe submitted a leave request for RP5/2026',
 *   'info',
 *   { leaveRequestId: '...' }
 * )
 * ```
 */
export async function notifyAllAdmins(
  title: string,
  message: string,
  type: NotificationType,
  link?: string
): Promise<NotificationResult> {
  try {
    const supabase = await createClient()

    // Get all admin users
    const { data: admins, error: adminsError } = await supabase
      .from('an_users')
      .select('id')
      .eq('role', 'admin')

    if (adminsError || !admins || admins.length === 0) {
      logger.error('No admin users found', {
        source: 'NotificationService',
        severity: ErrorSeverity.WARNING,
        metadata: { operation: 'notifyAllAdmins' },
      })
      return {
        success: false,
        error: 'No admin users found',
      }
    }

    // Create notifications for all admins
    const notifications = admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type,
      link,
    }))

    return await createBulkNotifications(notifications)
  } catch (error) {
    logger.error((error as Error).message, {
      source: 'NotificationService',
      severity: ErrorSeverity.ERROR,
      metadata: { operation: 'notifyAllAdmins', title, type },
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
