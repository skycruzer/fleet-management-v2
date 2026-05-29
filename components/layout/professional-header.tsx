/**
 * Professional Header
 * Developer: Maurice Rondeau
 *
 * Sticky header for the admin dashboard with global search, notifications,
 * theme toggle, and user menu. User dropdown includes Settings, Help Center,
 * and Feedback links (moved from sidebar for cleaner navigation).
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils/date-utils'
import {
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { GlobalSearch } from '@/components/search/global-search'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Notification {
  id: string
  recipient_id: string
  title: string
  message: string
  type: string
  read: boolean | null
  created_at: string | null
  link?: string | null
  updated_at?: string | null
}

interface ProfessionalHeaderProps {
  userName?: string
  userEmail?: string
}

export function ProfessionalHeader({ userName, userEmail }: ProfessionalHeaderProps) {
  const { csrfToken } = useCsrfToken()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { shouldAnimate } = useAnimationSettings()
  const [showNotifications, setShowNotifications] = useState(false)

  // Notifications via TanStack Query — handles caching, dedup, abort, and
  // background-refetch suppression for free. Replaces hand-rolled
  // setInterval + AbortController + setState plumbing.
  const notificationsQuery = useQuery<Notification[]>({
    queryKey: ['admin-notifications'],
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/notifications', { signal })
      const data = await response.json()
      return Array.isArray(data?.data) ? data.data : []
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  })
  const notifications = notificationsQuery.data ?? []
  const loading = notificationsQuery.isLoading

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ notificationId }),
        credentials: 'include',
      })
      if (!response.ok) throw new Error(`mark-read failed: ${response.status}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    },
  })

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markReadMutation.mutateAsync(notification.id)
      setShowNotifications(false)
      if (notification.link) {
        router.push(notification.link)
      } else {
        router.push('/dashboard/notifications')
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error)
    }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Recently'

    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return formatDate(date)
  }
  const [showUserMenu, setShowUserMenu] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Manual Escape + outside-click handlers removed — Radix Popover (used
  // below for both dropdowns) handles focus trapping, ESC dismissal, and
  // outside-click natively, with proper ARIA wiring.

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      if (response.ok || response.redirected) {
        // Redirect to login page
        window.location.href = '/auth/login'
      } else {
        console.error('Logout failed')
        // Redirect to login anyway
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Redirect to login anyway
      window.location.href = '/auth/login'
    }
  }

  const navigateAndClose = (href: string) => {
    setShowUserMenu(false)
    router.push(href)
  }

  const displayName = userName || 'Admin'
  const displayEmail = userEmail || ''

  return (
    <header className="border-border bg-card sticky top-0 z-30 border-b">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left Section - Global Search */}
        <div className="flex flex-1 items-center gap-4">
          <GlobalSearch />
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications — Radix Popover handles outside-click, ESC, and ARIA */}
          <Popover
            open={showNotifications}
            onOpenChange={(open) => {
              setShowNotifications(open)
              if (open) notificationsQuery.refetch()
            }}
          >
            <PopoverTrigger asChild>
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                aria-label={
                  unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                }
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-80 p-0"
              aria-label="Notifications"
            >
              <div className="border-border border-b px-3 py-2.5">
                <h3 className="text-foreground text-sm font-semibold">Notifications</h3>
                <p className="text-muted-foreground text-xs">{unreadCount} unread</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="text-muted-foreground p-3 text-center text-xs">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-muted-foreground p-3 text-center text-xs">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => {
                    // Non-color signal for the notification type: an icon + an
                    // sr-only label so colorblind and screen-reader users get
                    // the type, not just the dot's background color.
                    const typeLabel =
                      notification.type === 'warning'
                        ? 'Warning'
                        : notification.type === 'success'
                          ? 'Success'
                          : notification.type === 'error'
                            ? 'Error'
                            : 'Info'
                    const TypeIcon =
                      notification.type === 'warning'
                        ? AlertTriangle
                        : notification.type === 'success'
                          ? CheckCircle
                          : notification.type === 'error'
                            ? AlertCircle
                            : Info
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'border-border hover:bg-muted/50 w-full border-b px-3 py-2.5 text-left transition-colors',
                          !notification.read && 'bg-[var(--color-info-bg)]'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <TypeIcon
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 flex-shrink-0',
                              notification.type === 'warning' && 'text-warning',
                              notification.type === 'success' && 'text-success',
                              notification.type === 'error' && 'text-destructive',
                              notification.type === 'info' && 'text-accent'
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground text-sm font-medium">
                              <span className="sr-only">{typeLabel}: </span>
                              {notification.title}
                            </p>
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {notification.message}
                            </p>
                            <p className="text-muted-foreground/70 mt-0.5 text-xs">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              <div className="border-border border-t px-3 py-2">
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    router.push('/dashboard/notifications')
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full rounded-md py-1.5 text-xs font-medium transition-colors"
                >
                  View All
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu — Radix Popover */}
          <Popover open={showUserMenu} onOpenChange={setShowUserMenu}>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className="hover:bg-muted/60 ml-1 flex h-8 items-center gap-2 rounded-md px-2 transition-colors"
                aria-label="User menu"
              >
                <div className="bg-muted/60 flex h-6 w-6 items-center justify-center rounded-full">
                  <User className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-foreground hidden text-sm font-medium sm:inline">
                  {displayName}
                </span>
              </motion.button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-52 p-0" aria-label="User menu">
              <div className="border-border border-b px-3 py-2.5">
                <p className="text-foreground text-sm font-medium">{displayName}</p>
                {displayEmail && (
                  <p className="text-muted-foreground truncate text-xs">{displayEmail}</p>
                )}
              </div>
              <div className="p-1" role="menu" aria-label="User options">
                <button
                  onClick={() => navigateAndClose('/dashboard/settings')}
                  className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  role="menuitem"
                >
                  <Settings className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="border-border border-t p-1" role="menu" aria-label="Help & support">
                <button
                  onClick={() => navigateAndClose('/dashboard/help')}
                  className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  role="menuitem"
                >
                  <HelpCircle className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  <span>Help Center</span>
                </button>
                <button
                  onClick={() => navigateAndClose('/dashboard/feedback')}
                  className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  role="menuitem"
                >
                  <MessageSquare className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                  <span>Feedback</span>
                </button>
              </div>
              <div className="border-border border-t p-1" role="menu" aria-label="Account actions">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-danger-400)] transition-colors hover:bg-[var(--color-destructive-muted)]"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
