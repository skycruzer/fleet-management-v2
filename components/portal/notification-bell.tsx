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
        <div className="bg-card">
          {/* Header */}
          <div className="border-border border-b p-4">
            <h3 className="text-foreground text-lg font-semibold">Notifications</h3>
            <p className="text-muted-foreground text-sm">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Notification List */}
          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-border divide-y">
                {notifications.slice(0, 5).map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '/portal/notifications'}
                    className="hover:bg-muted block transition-colors"
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
                          <p className="text-foreground text-sm font-semibold">
                            {notification.title}
                          </p>
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {notification.message}
                          </p>
                          <p className="text-muted-foreground/70 mt-1 text-xs">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-info)]" />
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
            <div className="border-border border-t p-3">
              <Link
                href="/portal/notifications"
                className="text-primary hover:text-primary/80 block text-center text-sm font-medium"
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
