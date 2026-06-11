'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  UserCircle,
  MessageSquare,
  Bell,
  Calendar,
  CalendarDays,
  FileCheck,
  LogOut,
  LayoutDashboard,
  Menu,
  Settings,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/portal/notification-bell'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useConfirm } from '@/components/ui/confirm-dialog'

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
    title: 'Leave Bids',
    href: '/portal/leave-bids',
    icon: CalendarDays,
    description: 'Annual leave bidding',
  },
  {
    title: 'Notifications',
    href: '/portal/notifications',
    icon: Bell,
    description: 'View notifications',
  },
  {
    title: 'Feedback',
    href: '/portal/feedback',
    icon: MessageSquare,
    description: 'Share your feedback',
  },
  {
    title: 'Settings',
    href: '/portal/settings',
    icon: Settings,
    description: 'Account & password',
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
  // Track mount status for hydration (email rendered client-side only)
  const [mounted, setMounted] = useState(false)
  const { confirm, ConfirmDialog: LogoutConfirmDialog } = useConfirm()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close the mobile drawer if the viewport crosses into desktop (lg breakpoint),
  // otherwise the sheet overlay + body scroll-lock would linger behind the static sidebar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isActive = (href: string) => {
    if (href === '/portal/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const performLogout = async () => {
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

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      description: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'default',
    })
    if (confirmed) {
      performLogout()
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  // Shared sidebar content for the desktop aside and the mobile sheet.
  // The mobile sheet hides the notification bell — the sheet's close button
  // occupies that corner, and the bell is already in the mobile header.
  const renderSidebarContent = ({ showNotificationBell }: { showNotificationBell: boolean }) => (
    <SidebarShell
      header={
        <>
          {/* Logo Header */}
          <div className="flex h-12 items-center gap-2 border-b border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] px-4">
            <Image
              src="/images/air-niugini-logo.jpg"
              alt="Air Niugini"
              width={28}
              height={28}
              className="h-7 w-7 flex-shrink-0 rounded-md object-contain"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold text-white">B767 Pilot Portal</h1>
              <p className="truncate text-[10px] text-[var(--color-sidebar-muted)]">
                Air Niugini Ltd
              </p>
            </div>
            {showNotificationBell && (
              <NotificationBell className="text-[var(--color-sidebar-foreground)] hover:bg-white/10 hover:text-white" />
            )}
          </div>

          {/* Pilot Info */}
          {(pilotName || pilotRank) && (
            <div className="border-b border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-sidebar-active)]">
                  <UserCircle className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{pilotName || 'Welcome'}</p>
                  {pilotRank && (
                    <p className="text-sm text-[var(--color-sidebar-foreground)]">{pilotRank}</p>
                  )}
                  {employeeId && (
                    <p className="mt-1 text-xs text-[var(--color-sidebar-muted)]">
                      ID: {employeeId}
                    </p>
                  )}
                  {mounted && email && (
                    <p className="truncate text-xs text-[var(--color-sidebar-muted)]">{email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      }
      footer={
        <div className="border-t border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] p-4">
          <button
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-md border border-[rgba(201,55,44,0.5)] px-4 py-3 text-sm font-medium text-[#ffb3ac] transition-colors hover:border-[rgba(201,55,44,0.8)] hover:bg-[rgba(201,55,44,0.2)]"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      }
    >
      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-1">
          {/* Dashboard Link */}
          <Link
            href="/portal/dashboard"
            onClick={closeMobileMenu}
            aria-current={isActive('/portal/dashboard') ? 'page' : undefined}
          >
            <div
              className={cn(
                'group relative flex min-h-[44px] items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                isActive('/portal/dashboard')
                  ? 'bg-[var(--color-sidebar-active)] text-white'
                  : 'text-[var(--color-sidebar-foreground)] hover:bg-white/5 hover:text-white'
              )}
            >
              <LayoutDashboard
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive('/portal/dashboard')
                    ? 'text-white'
                    : 'text-[var(--color-sidebar-muted)] group-hover:text-white'
                )}
              />

              <div className="flex-1">
                <div className="font-semibold">Dashboard</div>
                <div className="text-sm text-[var(--color-sidebar-muted)]">Home &amp; overview</div>
              </div>
            </div>
          </Link>

          {/* Divider */}
          <div className="my-3 border-t border-[var(--color-sidebar-border)]"></div>

          {/* Navigation Items */}
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                aria-current={active ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'group relative flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--color-sidebar-active)] text-white'
                      : 'text-[var(--color-sidebar-foreground)] hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active
                        ? 'text-white'
                        : 'text-[var(--color-sidebar-muted)] group-hover:text-white'
                    )}
                  />

                  <span className="flex-1 font-semibold">{item.title}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </SidebarShell>
  )

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="border-border bg-card fixed top-0 right-0 left-0 z-[var(--z-header)] flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/images/air-niugini-logo.jpg"
            alt="Air Niugini"
            width={28}
            height={28}
            className="h-7 w-7 flex-shrink-0 rounded-md object-contain"
          />
          <div className="min-w-0">
            <h1 className="text-foreground truncate text-sm font-semibold" tabIndex={-1}>
              B767 Pilot Portal
            </h1>
            <p className="text-muted-foreground truncate text-[10px]">Air Niugini Ltd</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-foreground hover:bg-muted flex h-11 w-11 items-center justify-center rounded-lg"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer (Radix Sheet: focus trap, Escape, aria-modal) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-60 border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] p-0 lg:hidden"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Pilot portal navigation</SheetTitle>
          {renderSidebarContent({ showNotificationBell: false })}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar — static, no entrance animation */}
      <aside
        className="fixed top-0 left-0 z-[var(--z-sidebar)] hidden h-screen w-60 border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] lg:block"
        role="navigation"
        aria-label="Pilot portal navigation"
      >
        {renderSidebarContent({ showNotificationBell: true })}
      </aside>
      <LogoutConfirmDialog />
    </>
  )
}
