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
import Link from 'next/link'
import { csrfHeaders } from '@/lib/hooks/use-csrf-token'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
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

const PAGE_SIZE = 20

/** Mirrors the dot color mapping in components/portal/notification-bell.tsx */
function getNotificationDotColor(type: string) {
  const colors: Record<string, string> = {
    leave_approved: 'bg-[var(--color-status-low)]',
    leave_denied: 'bg-[var(--color-status-high)]',
    flight_approved: 'bg-[var(--color-info)]',
    flight_denied: 'bg-[var(--color-status-medium)]',
    certification_expiring: 'bg-[var(--color-status-medium)]',
    certification_expired: 'bg-[var(--color-status-high)]',
    task_assigned: 'bg-[var(--color-info)]',
    registration_approved: 'bg-[var(--color-status-low)]',
    registration_denied: 'bg-[var(--color-status-high)]',
    system_alert: 'bg-[var(--color-info)]',
    general: 'bg-muted-foreground',
  }
  return colors[type] || 'bg-muted-foreground'
}

/** 'leave_approved' → 'Leave approved' */
function humanizeType(type: string) {
  const label = type.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [markingAsReadId, setMarkingAsReadId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const { confirm, ConfirmDialog } = useConfirm()

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
    const confirmed = await confirm({
      title: 'Delete Notification',
      description: 'This notification will be permanently deleted. This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    })
    if (!confirmed) return

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

  const unreadCount = notifications.filter((n) => !n.read).length
  const visibleNotifications = notifications.slice(0, visibleCount)
  const remainingCount = notifications.length - visibleCount

  if (isLoading) {
    return (
      <div>
        <PageHead title="Notifications" description="Loading…" />
        <main className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-5 w-64 max-w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

      <ConfirmDialog />

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
            {visibleNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={
                  notification.read ? undefined : 'border-l-4 border-l-[var(--color-primary-500)]'
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${getNotificationDotColor(notification.type)}`}
                          aria-hidden="true"
                        />
                        <span className="text-muted-foreground text-xs font-medium">
                          {humanizeType(notification.type)}
                        </span>
                        {!notification.read && (
                          <Badge variant="outline" className="bg-[var(--color-info-bg)]">
                            New
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-foreground text-base">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>

                    <div className="flex shrink-0 gap-2">
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
                    <Button asChild variant="link" className="mt-4 h-auto p-0">
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.read) {
                            // Fire-and-forget: mark read, then let Link navigate
                            markAsRead(notification.id)
                          }
                        }}
                      >
                        View Details →
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {remainingCount > 0 && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more ({remainingCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
