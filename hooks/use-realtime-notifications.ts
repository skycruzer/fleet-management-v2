/**
 * Real-time Notifications Hook
 *
 * Subscribes to Supabase Realtime for instant notification updates
 * Provides real-time notifications for leave/flight request approvals and denials
 *
 * @created 2025-10-29
 * @priority Priority 2
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { announceToScreenReader } from '@/lib/utils/accessibility-helpers'

interface Notification {
  id: string
  recipient_id: string
  type:
    | 'leave_approved'
    | 'leave_denied'
    | 'flight_approved'
    | 'flight_denied'
    | 'certification_expiring'
    | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: Record<string, any>
}

interface UseRealtimeNotificationsOptions {
  pilotId: string
  enabled?: boolean
  onNewNotification?: (notification: Notification) => void
}

/**
 * Hook for real-time notification updates via Supabase Realtime
 *
 * @example
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications({
 *   pilotId: currentPilot.id,
 *   enabled: true,
 *   onNewNotification: (notification) => {
 *     // Custom handling for new notifications
 *     console.log('New notification:', notification)
 *   }
 * })
 */
export function useRealtimeNotifications({
  pilotId,
  enabled = true,
  onNewNotification,
}: UseRealtimeNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!pilotId || !enabled) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', pilotId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setNotifications((data as unknown as Notification[]) || [])
      setUnreadCount((data || []).filter((n) => !n.read).length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [pilotId, enabled, supabase])

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)

        if (updateError) throw updateError

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    },
    [supabase]
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', pilotId)
        .eq('read', false)

      if (updateError) throw updateError

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)

      toast({
        variant: 'success',
        title: 'Success',
        description: 'All notifications marked as read',
      })
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read',
      })
    }
  }, [pilotId, supabase])

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)

        if (deleteError) throw deleteError

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        setUnreadCount((prev) => {
          const notification = notifications.find((n) => n.id === notificationId)
          return notification && !notification.read ? prev - 1 : prev
        })

        toast({
          variant: 'success',
          title: 'Success',
          description: 'Notification deleted',
        })
      } catch (err) {
        console.error('Error deleting notification:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete notification',
        })
      }
    },
    [notifications, supabase]
  )

  // Handle new notification from Realtime
  const handleNewNotification = useCallback(
    (notification: Notification) => {
      // Add to state
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast notification
      const notificationTypeMap: Record<
        string,
        { variant: 'success' | 'destructive' | 'default'; title: string }
      > = {
        leave_approved: { variant: 'success', title: '✅ Leave Request Approved' },
        leave_denied: { variant: 'destructive', title: '❌ Leave Request Denied' },
        flight_approved: { variant: 'success', title: '✅ Flight Request Approved' },
        flight_denied: { variant: 'destructive', title: '❌ Flight Request Denied' },
        certification_expiring: { variant: 'default', title: '⚠️ Certification Expiring' },
        info: { variant: 'default', title: 'ℹ️ New Notification' },
      }

      const config = notificationTypeMap[notification.type] || notificationTypeMap.info

      toast({
        variant: config.variant,
        title: config.title,
        description: notification.message,
      })

      // Announce to screen readers
      announceToScreenReader(`${config.title}. ${notification.message}`, 'polite')

      // Call custom handler if provided
      onNewNotification?.(notification)
    },
    [onNewNotification]
  )

  // Setup Realtime subscription
  useEffect(() => {
    if (!pilotId || !enabled) return

    // Fetch initial notifications
    fetchNotifications()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`notifications:${pilotId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${pilotId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          handleNewNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${pilotId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${pilotId}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [pilotId, enabled, fetchNotifications, handleNewNotification, supabase])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}

/**
 * Notification Type Helper
 *
 * Get appropriate icon and color for notification type
 */
export function getNotificationTypeConfig(type: Notification['type']) {
  const configs = {
    leave_approved: {
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    leave_denied: {
      icon: '❌',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    flight_approved: {
      icon: '✈️',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    flight_denied: {
      icon: '🚫',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    certification_expiring: {
      icon: '⚠️',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    info: {
      icon: 'ℹ️',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  }

  return configs[type] || configs.info
}
