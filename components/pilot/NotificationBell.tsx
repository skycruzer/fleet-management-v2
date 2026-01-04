'use client'

/**
 * Notification Bell Component
 *
 * Displays notification bell icon with unread count and dropdown.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function NotificationBell() {
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
      const response = await fetch('/api/pilot/notifications?unread_only=true')
      const result = await response.json()

      if (result.success) {
        setUnreadCount(result.count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link
      href="/pilot/notifications"
      className="relative inline-flex items-center rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      aria-label="View notifications"
    >
      {/* Bell Icon */}
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Badge */}
      {!isLoading && unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
