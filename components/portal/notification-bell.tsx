'use client'

/**
 * Notification Bell Component
 *
 * Displays unread notification count and links to notifications page.
 * Polls for new notifications every 30 seconds.
 *
 * @spec 001-missing-core-features (US1)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/portal/notifications?countOnly=true')
      const result = await response.json()

      if (response.ok && result.success) {
        setUnreadCount(result.data?.count || 0)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
      setIsLoading(false)
    }
  }

  return (
    <Link href="/portal/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {!isLoading && unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        <span className="sr-only">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        </span>
      </Button>
    </Link>
  )
}
