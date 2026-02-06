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
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/portal/notification-bell'
import { SidebarShell } from '@/components/layout/sidebar-shell'

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
    title: 'My Requests',
    href: '/portal/requests',
    icon: Calendar,
    description: 'Leave & RDO/SDO requests',
  },
  {
    title: 'Feedback',
    href: '/portal/feedback',
    icon: MessageSquare,
    description: 'Share your feedback',
  },
  {
    title: 'Feedback History',
    href: '/portal/feedback/history',
    icon: Clock,
    description: 'View past feedback',
  },
]

interface PilotPortalSidebarProps {
  pilotName?: string
  pilotRank?: string
  employeeId?: string
  email?: string
}

export function PilotPortalSidebar({
  pilotName,
  pilotRank,
  employeeId,
  email,
}: PilotPortalSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Initialize isDesktop as false to match server render, then update after hydration
  const [isDesktop, setIsDesktop] = useState(false)
  // Track mount status for hydration
  const [mounted, setMounted] = useState(false)

  // Track screen size for responsive sidebar positioning - update after mount
  // Uses lg breakpoint (1024px) for consistency with admin portal
  useEffect(() => {
    setMounted(true)
    // Set initial desktop state after hydration
    setIsDesktop(window.innerWidth >= 1024)

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
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
        credentials: 'include',
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
      <div className="border-border bg-card/95 fixed top-0 right-0 left-0 z-[var(--z-header)] flex h-16 items-center justify-between border-b px-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Plane className="text-primary-foreground h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-lg font-bold" tabIndex={-1}>
              Pilot Portal
            </h1>
            <p className="text-muted-foreground text-xs">Crew Access</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground hover:bg-muted flex h-10 w-10 items-center justify-center rounded-lg"
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
            className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop (always visible) and Mobile (slide in) */}
      <motion.aside
        initial={{ x: isDesktop ? 0 : -240 }}
        animate={{
          x: isDesktop ? 0 : mobileMenuOpen ? 0 : -240,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="border-border bg-background fixed top-0 left-0 z-[var(--z-modal)] h-screen w-60 border-r lg:z-[var(--z-sidebar)]"
      >
        <SidebarShell
          header={
            <>
              {/* Logo Header */}
              <div className="border-border bg-card flex h-16 items-center gap-3 border-b px-6">
                <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
                  <Plane className="text-primary-foreground h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h1 className="text-foreground text-lg font-bold">Pilot Portal</h1>
                  <p className="text-muted-foreground text-xs">Crew Access</p>
                </div>
                {/* Notification Bell */}
                <NotificationBell />
              </div>

              {/* Pilot Info */}
              {(pilotName || pilotRank) && (
                <div className="border-border bg-card border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                      <UserCircle className="text-primary h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground font-semibold">{pilotRank || 'Pilot'}</p>
                      <p className="text-muted-foreground text-sm">{pilotName || 'Welcome'}</p>
                      {employeeId && (
                        <p className="text-muted-foreground mt-1 text-xs">ID: {employeeId}</p>
                      )}
                      {mounted && email && (
                        <p className="text-muted-foreground truncate text-xs">{email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          }
          footer={
            <div className="border-border bg-card border-t p-4">
              <button
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          }
        >
          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {/* Dashboard Link */}
              <Link href="/portal/dashboard" onClick={closeMobileMenu}>
                <div
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive('/portal/dashboard')
                      ? 'bg-primary/15 text-primary border-primary border-l-2'
                      : 'text-foreground hover:bg-accent/50'
                  )}
                >
                  <Cloud
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isActive('/portal/dashboard')
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />

                  <div className="flex-1">
                    <div className="font-semibold">Dashboard</div>
                    <div
                      className={cn(
                        'text-sm',
                        isActive('/portal/dashboard') ? 'text-primary/80' : 'text-muted-foreground'
                      )}
                    >
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
              <div className="border-border my-3 border-t"></div>

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
                          ? 'bg-primary/15 text-primary border-primary border-l-2'
                          : 'text-foreground hover:bg-accent/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />

                      <div className="flex-1">
                        <div className="font-semibold">{item.title}</div>
                        <div
                          className={cn(
                            'text-sm',
                            active ? 'text-primary/80' : 'text-muted-foreground'
                          )}
                        >
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
        </SidebarShell>
      </motion.aside>
    </>
  )
}
