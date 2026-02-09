/**
 * Professional Header
 * Developer: Maurice Rondeau
 *
 * Sticky header for the admin dashboard with global search, notifications,
 * theme toggle, and user menu. User dropdown includes Settings, Help Center,
 * and Feedback links (moved from sidebar for cleaner navigation).
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, Settings, LogOut, HelpCircle, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { GlobalSearch } from '@/components/search/global-search'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { ThemeToggle } from '@/components/ui/theme-toggle'

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
  const { shouldAnimate } = useAnimationSettings()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ notificationId: notification.id }),
        credentials: 'include',
      })

      // Close dropdown
      setShowNotifications(false)

      // Navigate to link or notifications page
      if (notification.link) {
        router.push(notification.link)
      } else {
        router.push('/dashboard/notifications')
      }

      // Refresh notifications
      fetchNotifications()
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
    return date.toLocaleDateString()
  }
  const [showUserMenu, setShowUserMenu] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Keyboard navigation: Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifications) {
          setShowNotifications(false)
        }
        if (showUserMenu) {
          setShowUserMenu(false)
        }
      }
    }

    if (showNotifications || showUserMenu) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showNotifications, showUserMenu])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showNotifications && !target.closest('[data-notifications-dropdown]')) {
        setShowNotifications(false)
      }
      if (showUserMenu && !target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications, showUserMenu])

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
    <header className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left Section - Global Search */}
        <div className="flex flex-1 items-center gap-4">
          <GlobalSearch />
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" data-notifications-dropdown>
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60 relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              aria-label={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
              }
              aria-expanded={showNotifications}
              aria-haspopup="true"
              style={{ willChange: 'transform' }}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="bg-accent absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium text-white"
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 1 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="border-border bg-popover absolute right-0 mt-1 w-80 rounded-lg border shadow-lg backdrop-blur-xl"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="border-border border-b px-3 py-2.5">
                    <h3 className="text-foreground text-sm font-semibold">Notifications</h3>
                    <p className="text-muted-foreground text-xs">{unreadCount} unread</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {loading ? (
                      <div className="text-muted-foreground p-3 text-center text-xs">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-muted-foreground p-3 text-center text-xs">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'border-border hover:bg-muted/50 w-full border-b px-3 py-2.5 text-left transition-colors',
                            !notification.read && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full',
                                notification.type === 'warning' && 'bg-warning',
                                notification.type === 'success' && 'bg-success',
                                notification.type === 'error' && 'bg-destructive',
                                notification.type === 'info' && 'bg-accent'
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground text-sm font-medium">
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
                      ))
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative ml-1" data-user-menu>
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="hover:bg-muted/60 flex h-8 items-center gap-2 rounded-md px-2 transition-colors"
              aria-label="User menu"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              style={{ willChange: 'transform' }}
            >
              <div className="bg-muted/60 flex h-6 w-6 items-center justify-center rounded-full">
                <User className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="text-foreground hidden text-sm font-medium sm:inline">
                {displayName}
              </span>
            </motion.button>

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 1 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="border-border bg-popover absolute right-0 mt-1 w-52 rounded-lg border shadow-lg backdrop-blur-xl"
                  style={{ willChange: 'transform, opacity' }}
                >
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
                      <User className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => navigateAndClose('/dashboard/settings')}
                      className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                      role="menuitem"
                    >
                      <Settings className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                      <span>Settings</span>
                    </button>
                  </div>
                  <div
                    className="border-border border-t p-1"
                    role="menu"
                    aria-label="Help & support"
                  >
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
                  <div
                    className="border-border border-t p-1"
                    role="menu"
                    aria-label="Account actions"
                  >
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-danger-400)] transition-colors hover:bg-[var(--color-destructive-muted)]"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
