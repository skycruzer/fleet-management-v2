'use client'

/**
 * Notification Bell Component with Dropdown
 *
 * Displays unread notification count and shows dropdown panel with recent notifications.
 * Polls for new notifications every 30 seconds.
 *
 * @spec 001-missing-core-features (US1)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/portal/notifications')
        const result = await response.json()

        if (response.ok && result.success) {
          setNotifications(result.data || [])
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    const colors: Record<string, string> = {
      leave_approved: 'bg-green-500',
      leave_denied: 'bg-red-500',
      flight_approved: 'bg-blue-500',
      flight_denied: 'bg-orange-500',
      certification_expiring: 'bg-yellow-500',
      certification_expired: 'bg-red-600',
      task_assigned: 'bg-cyan-500',
      registration_approved: 'bg-green-600',
      registration_denied: 'bg-red-600',
      system_alert: 'bg-blue-600',
      general: 'bg-gray-400',
    }
    return colors[type] || 'bg-gray-400'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="bg-white">
          {/* Header */}
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-gray-500">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Notification List */}
          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 5).map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '/portal/notifications'}
                    className="block transition-colors hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Color Indicator */}
                        <div
                          className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${getNotificationIcon(notification.notification_type)}`}
                        />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-3">
              <Link
                href="/portal/notifications"
                className="block text-center text-sm font-medium text-cyan-600 hover:text-cyan-700"
                onClick={() => setIsOpen(false)}
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
