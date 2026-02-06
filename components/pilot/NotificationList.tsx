'use client'

/**
 * Notification List Component
 *
 * Displays list of notifications with mark as read functionality.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean | null
  created_at: string | null
}

interface NotificationListProps {
  notifications: Notification[]
  initialUnreadCount: number
}

export default function NotificationList({
  notifications,
  initialUnreadCount,
}: NotificationListProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/pilot/notifications/${notificationId}`, {
        method: 'PATCH',
      })

      setUnreadCount((prev) => Math.max(0, prev - 1))
      router.refresh()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-card rounded-lg p-8 text-center shadow">
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card flex items-center justify-between rounded-lg p-4 shadow">
        <h2 className="text-foreground text-lg font-medium">All Notifications</h2>
        <span className="rounded-full bg-[var(--color-info-bg)] px-3 py-1 text-sm font-medium text-[var(--color-info)]">
          {unreadCount} unread
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-card hover:bg-muted/30 rounded-lg p-4 shadow transition-colors ${
              !notification.is_read ? 'border-l-4 border-[var(--color-primary-500)]' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground font-medium">{notification.title}</h3>
                  {!notification.is_read && (
                    <span className="rounded-full bg-[var(--color-primary-500)] px-2 py-0.5 text-xs font-medium text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{notification.message}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString()
                    : 'Unknown date'}
                </p>
              </div>
              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="ml-4 text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-500)]"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
