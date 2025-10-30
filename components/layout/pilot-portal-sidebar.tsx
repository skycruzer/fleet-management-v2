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
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-cyan-200 bg-white/95 px-4 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-cyan-900">Pilot Portal</h1>
            <p className="text-xs text-cyan-700">Crew Access</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-cyan-900 hover:bg-cyan-100"
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
        className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-cyan-200 bg-gradient-to-b from-cyan-50 to-blue-50 md:z-40"
      >
      {/* Logo Header */}
      <div className="flex h-16 items-center gap-3 border-b border-cyan-200 bg-white/50 px-6 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
          <Plane className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-cyan-900">Pilot Portal</h1>
          <p className="text-xs text-cyan-700">Crew Access</p>
        </div>
        {/* Notification Bell */}
        <NotificationBell />
      </div>

      {/* Pilot Info */}
      {(pilotName || pilotRank) && (
        <div className="border-b border-cyan-200 bg-white/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg">
              <UserCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-cyan-900">{pilotRank || 'Pilot'}</p>
              <p className="text-sm text-cyan-700">{pilotName || 'Welcome'}</p>
              {employeeId && (
                <p className="text-xs text-cyan-600 mt-1">ID: {employeeId}</p>
              )}
              {email && (
                <p className="text-xs text-cyan-600 truncate">{email}</p>
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
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                isActive('/portal/dashboard')
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-cyan-900 hover:bg-white/50 hover:shadow-sm'
              )}
            >
              {/* Active indicator */}
              {isActive('/portal/dashboard') && (
                <motion.div
                  layoutId="pilotActiveIndicator"
                  className="absolute left-0 h-10 w-1 rounded-r-full bg-cyan-700"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <Cloud
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive('/portal/dashboard') ? 'text-white' : 'text-cyan-600 group-hover:text-cyan-700'
                )}
              />

              <div className="flex-1">
                <div className="font-semibold">Dashboard</div>
                <div className={cn(
                  "text-xs",
                  isActive('/portal/dashboard') ? 'text-cyan-100' : 'text-cyan-600'
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
            </motion.div>
          </Link>

          {/* Divider */}
          <div className="my-3 border-t border-cyan-200"></div>

          {/* Navigation Items */}
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-cyan-900 hover:bg-white/50 hover:shadow-sm'
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="pilotActiveIndicator"
                      className="absolute left-0 h-10 w-1 rounded-r-full bg-cyan-700"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-white' : 'text-cyan-600 group-hover:text-cyan-700'
                    )}
                  />

                  <div className="flex-1">
                    <div className="font-semibold">{item.title}</div>
                    <div className={cn(
                      "text-xs",
                      active ? 'text-cyan-100' : 'text-cyan-600'
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
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section - Logout */}
      <div className="border-t border-cyan-200 bg-white/30 p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-red-600 hover:to-red-700 hover:shadow-xl"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  </>
  )
}
