'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane,
  UserCircle,
  MessageSquare,
  Calendar,
  FileCheck,
  LogOut,
  ChevronRight,
  Cloud,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/portal/notification-bell'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigationItems: NavItem[] = [
  {
    title: 'My Profile',
    href: '/portal/profile',
    icon: UserCircle,
    description: 'Personal information',
  },
  {
    title: 'Certifications',
    href: '/portal/certifications',
    icon: FileCheck,
    description: 'View your certifications',
  },
  {
    title: 'Leave Requests',
    href: '/portal/leave-requests',
    icon: Calendar,
    description: 'Manage leave requests',
  },
  {
    title: 'Flight Requests',
    href: '/portal/flight-requests',
    icon: Plane,
    description: 'Submit flight requests',
  },
  {
    title: 'Feedback',
    href: '/portal/feedback',
    icon: MessageSquare,
    description: 'Share your feedback',
  },
]

interface PilotPortalSidebarProps {
  pilotName?: string
  pilotRank?: string
  employeeId?: string
  email?: string
}

export function PilotPortalSidebar({ pilotName, pilotRank, employeeId, email }: PilotPortalSidebarProps) {
  const { csrfToken } = useCsrfToken()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  // Track screen size for responsive sidebar positioning
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const isActive = (href: string) => {
    if (href === '/portal/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
      })

      if (response.ok || response.redirected) {
        window.location.href = '/portal/login'
      } else {
        console.error('Logout failed')
        window.location.href = '/portal/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/portal/login'
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Pilot Portal</h1>
            <p className="text-xs text-muted-foreground">Crew Access</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop (always visible) and Mobile (slide in) */}
      <motion.aside
        initial={{ x: isDesktop ? 0 : -280 }}
        animate={{
          x: isDesktop ? 0 : (mobileMenuOpen ? 0 : -280),
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 md:z-40"
      >
      {/* Logo Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
          <Plane className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Pilot Portal</h1>
          <p className="text-xs text-muted-foreground">Crew Access</p>
        </div>
        {/* Notification Bell */}
        <NotificationBell />
      </div>

      {/* Pilot Info */}
      {(pilotName || pilotRank) && (
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <UserCircle className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{pilotRank || 'Pilot'}</p>
              <p className="text-sm text-muted-foreground">{pilotName || 'Welcome'}</p>
              {employeeId && (
                <p className="text-xs text-muted-foreground mt-1">ID: {employeeId}</p>
              )}
              {email && (
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {/* Dashboard Link */}
          <Link href="/portal/dashboard" onClick={closeMobileMenu}>
            <div
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                isActive('/portal/dashboard')
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Cloud
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive('/portal/dashboard') ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />

              <div className="flex-1">
                <div className="font-semibold">Dashboard</div>
                <div className={cn(
                  "text-sm",
                  isActive('/portal/dashboard') ? 'text-white/80' : 'text-muted-foreground'
                )}>
                  Home & overview
                </div>
              </div>

              <ChevronRight
                className={cn(
                  'h-4 w-4 opacity-0 transition-opacity',
                  'group-hover:opacity-100',
                  isActive('/portal/dashboard') && 'opacity-100'
                )}
              />
            </div>
          </Link>

          {/* Divider */}
          <div className="my-3 border-t border-slate-200 dark:border-slate-700"></div>

          {/* Navigation Items */}
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                <div
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-600 text-white'
                      : 'text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />

                  <div className="flex-1">
                    <div className="font-semibold">{item.title}</div>
                    <div className={cn(
                      "text-sm",
                      active ? 'text-white/80' : 'text-muted-foreground'
                    )}>
                      {item.description}
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      'h-4 w-4 opacity-0 transition-opacity',
                      'group-hover:opacity-100',
                      active && 'opacity-100'
                    )}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section - Logout */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  </>
  )
}
