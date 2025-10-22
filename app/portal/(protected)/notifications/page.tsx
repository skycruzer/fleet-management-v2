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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  notification_type: string
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

  useEffect(() => {
    fetchNotifications()
  }, [])

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
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/portal/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      leave_approved: 'bg-green-500',
      leave_denied: 'bg-red-500',
      flight_approved: 'bg-blue-500',
      flight_denied: 'bg-orange-500',
      certification_expiring: 'bg-yellow-500',
      certification_expired: 'bg-red-600',
      task_assigned: 'bg-purple-500',
      registration_approved: 'bg-green-600',
      registration_denied: 'bg-red-600',
      system_alert: 'bg-gray-500',
      general: 'bg-gray-400',
    }
    return colors[type] || 'bg-gray-400'
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading notifications...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? 'opacity-70' : 'border-l-4 border-l-blue-500'}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className={getNotificationBadgeColor(notification.notification_type)}>
                        {notification.notification_type.replace(/_/g, ' ')}
                      </Badge>
                      {!notification.read && (
                        <Badge variant="outline" className="bg-blue-100">
                          New
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{notification.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700">{notification.message}</p>

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
    </div>
  )
}
