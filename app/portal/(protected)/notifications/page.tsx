'use client'

/**
 * Pilot Portal Notifications Page
 *
 * Displays all notifications for the authenticated pilot.
 * Allows marking notifications as read and deleting them.
 *
 * @spec 001-missing-core-features (US1)
 */

import { useEffect, useState } from 'react'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHead } from '@/components/ui/page-head'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [markingAsReadId, setMarkingAsReadId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/portal/notifications')
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to fetch notifications')
          setIsLoading(false)
          return
        }

        setNotifications(result.data || [])
        setIsLoading(false)
      } catch {
        setError('An unexpected error occurred')
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    setMarkingAsReadId(notificationId)

    try {
      const response = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ notificationId }),
        credentials: 'include',
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
      } else {
        setError('Failed to mark notification as read')
      }
      setMarkingAsReadId(null)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      setError('An unexpected error occurred while updating notification')
      setMarkingAsReadId(null)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAllAsRead(true)

    try {
      const response = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({ markAll: true }),
        credentials: 'include',
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      } else {
        setError('Failed to mark all notifications as read')
      }
      setMarkingAllAsRead(false)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      setError('An unexpected error occurred while updating notifications')
      setMarkingAllAsRead(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setDeletingId(notificationId)

    try {
      const response = await fetch(`/api/portal/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: { ...csrfHeaders() },
        credentials: 'include',
      })

      if (response.ok) {
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      } else {
        setError('Failed to delete notification')
      }
      setDeletingId(null)
    } catch (err) {
      console.error('Failed to delete notification:', err)
      setError('An unexpected error occurred while deleting notification')
      setDeletingId(null)
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      leave_approved: 'bg-[var(--color-success-500)]',
      leave_denied: 'bg-[var(--color-danger-500)]',
      flight_approved: 'bg-[var(--color-primary-500)]',
      flight_denied: 'bg-[var(--color-badge-orange)]',
      certification_expiring: 'bg-[var(--color-warning-500)]',
      certification_expired: 'bg-[var(--color-danger-600)]',
      task_assigned: 'bg-[var(--color-info-bg)]0',
      registration_approved: 'bg-[var(--color-success-600)]',
      registration_denied: 'bg-[var(--color-danger-600)]',
      system_alert: 'bg-muted-foreground',
      general: 'bg-muted-foreground',
    }
    return colors[type] || 'bg-muted-foreground'
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div>
        <PageHead title="Notifications" description="Loading…" />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading notifications…</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div>
      <PageHead
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'All caught up.'
        }
        action={
          unreadCount > 0 ? (
            <Button onClick={markAllAsRead} variant="outline" size="sm" disabled={markingAllAsRead}>
              {markingAllAsRead ? 'Marking…' : 'Mark all as read'}
            </Button>
          ) : undefined
        }
      />

      <main className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={
                  notification.read
                    ? 'opacity-70'
                    : 'border-l-4 border-l-[var(--color-primary-500)]'
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className={getNotificationBadgeColor(notification.type)}>
                          {notification.type.replace(/_/g, ' ')}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="outline" className="bg-[var(--color-info-bg)]">
                            New
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{notification.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingAsReadId === notification.id}
                        >
                          {markingAsReadId === notification.id ? 'Marking...' : 'Mark as Read'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={deletingId === notification.id}
                      >
                        {deletingId === notification.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground">{notification.message}</p>

                  {notification.link && (
                    <Button
                      variant="link"
                      className="mt-4 p-0"
                      onClick={() => (window.location.href = notification.link!)}
                    >
                      View Details →
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
