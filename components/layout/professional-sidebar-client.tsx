/**
 * Professional Sidebar Client
 * Developer: Maurice Rondeau
 *
 * Admin sidebar with two-tier navigation: primary items always visible
 * + "More" expander for secondary items. Settings/Help/Feedback moved to header.
 * Expanded: 240px (w-60) — shows icons + labels
 * Collapsed: 56px (w-14) — shows icons only with tooltips on hover
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  LogOut,
  ChevronDown,
  BarChart3,
  AlertCircle,
  CheckSquare,
  Shield,
  ScrollText,
  RefreshCw,
  ClipboardList,
  CalendarHeart,
  FileSearch,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { useSidebarBadges } from '@/lib/hooks/use-sidebar-badges'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useSidebarCollapse } from '@/lib/hooks/use-sidebar-collapse'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'warning' | 'danger'
}

// Primary nav items — always visible, no section headers
const primaryNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Pilots', href: '/dashboard/pilots', icon: Users },
  { title: 'Certifications', href: '/dashboard/certifications', icon: FileCheck },
  { title: 'Requests', href: '/dashboard/requests', icon: ClipboardList },
  { title: 'Leave Bids', href: '/dashboard/admin/leave-bids', icon: CalendarHeart },
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

// Secondary nav items — under "More" expander
const moreNavItems: NavItem[] = [
  { title: 'Renewal Planning', href: '/dashboard/renewal-planning', icon: RefreshCw },
  { title: 'Reports', href: '/dashboard/reports', icon: ScrollText },
  { title: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { title: 'System Admin', href: '/dashboard/admin', icon: Shield },
  { title: 'Disciplinary', href: '/dashboard/disciplinary', icon: AlertCircle },
  { title: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileSearch },
  { title: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
]

interface ProfessionalSidebarClientProps {
  appTitle: string
  userRole: string | null
}

export function ProfessionalSidebarClient({ appTitle }: ProfessionalSidebarClientProps) {
  const { csrfToken } = useCsrfToken()
  const { shouldAnimate } = useAnimationSettings()
  const pathname = usePathname()
  const { data: badges } = useSidebarBadges()
  const { confirm, ConfirmDialog: LogoutConfirmDialog } = useConfirm()
  const { isCollapsed, toggleCollapse } = useSidebarCollapse()

  // Enrich nav items with dynamic badge data
  const enrichedItems = useMemo(() => {
    const enrich = (items: NavItem[]): NavItem[] =>
      items.map((item) => {
        if (item.title === 'Requests' && badges?.pendingRequests) {
          return {
            ...item,
            badge: String(badges.pendingRequests),
            badgeVariant: 'default' as const,
          }
        }
        if (item.title === 'Certifications' && badges) {
          const total = badges.expiredCertifications + badges.expiringCertifications
          if (total > 0) {
            return {
              ...item,
              badge: String(total),
              badgeVariant:
                badges.expiredCertifications > 0 ? ('danger' as const) : ('warning' as const),
            }
          }
        }
        return item
      })
    return { primary: enrich(primaryNavItems), more: enrich(moreNavItems) }
  }, [badges])

  // "More" section collapse state (persisted in localStorage)
  const [moreExpanded, setMoreExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidebar-more-expanded') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-more-expanded', String(moreExpanded))
  }, [moreExpanded])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  // Auto-expand "More" if user is on a secondary page
  useEffect(() => {
    const isOnMorePage = moreNavItems.some((item) => isActive(item.href))
    if (isOnMorePage && !moreExpanded) {
      setMoreExpanded(true)
    }
  }, [pathname, moreExpanded])

  const performLogout = async () => {
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
        window.location.href = '/auth/login'
      } else {
        window.location.href = '/auth/login'
      }
    } catch {
      window.location.href = '/auth/login'
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

  // Render a single nav item (shared between primary and more sections)
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link key={item.href} href={item.href} title={isCollapsed ? item.title : undefined}>
        <div
          className={cn(
            'group relative flex min-h-[32px] items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors duration-100',
            isCollapsed && 'justify-center px-0',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-colors',
              active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'
            )}
            aria-hidden="true"
          />

          {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}

          {/* Badge - Full text when expanded, dot when collapsed */}
          {item.badge && !isCollapsed && (
            <span
              className={cn(
                'flex-shrink-0 rounded px-1 py-0.5 text-xs font-medium tabular-nums',
                item.badgeVariant === 'warning' && 'bg-warning/10 text-warning',
                item.badgeVariant === 'danger' && 'bg-destructive/10 text-destructive',
                !item.badgeVariant && 'bg-muted-foreground/10 text-muted-foreground'
              )}
              aria-label={
                item.badgeVariant === 'danger'
                  ? `${item.badge} items requiring attention`
                  : item.badgeVariant === 'warning'
                    ? `${item.badge} items expiring soon`
                    : `${item.badge} new items`
              }
            >
              {item.badge}
            </span>
          )}
          {item.badge && isCollapsed && (
            <span
              className={cn(
                'absolute top-1 right-1 h-2 w-2 rounded-full',
                item.badgeVariant === 'warning' && 'bg-warning',
                item.badgeVariant === 'danger' && 'bg-destructive',
                !item.badgeVariant && 'bg-muted-foreground'
              )}
              aria-label={`${item.badge} items`}
            />
          )}
        </div>
      </Link>
    )
  }

  return (
    <motion.aside
      initial={shouldAnimate ? { x: -240 } : { x: 0 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'bg-card border-border fixed top-0 left-0 z-[var(--z-sidebar)] h-screen border-r transition-[width] duration-200',
        isCollapsed ? 'w-14' : 'w-60'
      )}
      style={{ willChange: 'transform' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <SidebarShell
        header={
          <div
            className={cn(
              'border-border flex h-12 items-center gap-2 border-b',
              isCollapsed ? 'justify-center px-2' : 'px-4'
            )}
          >
            <Image
              src="/images/air-niugini-logo.jpg"
              alt="Air Niugini"
              width={28}
              height={28}
              className="h-7 w-7 flex-shrink-0 rounded-md object-contain"
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <h1
                  className="text-foreground truncate text-sm font-semibold"
                  suppressHydrationWarning
                >
                  {appTitle}
                </h1>
              </div>
            )}
          </div>
        }
        footer={
          <div className="border-border border-t p-2">
            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapse}
              className={cn(
                'text-muted-foreground hover:bg-muted/50 hover:text-foreground mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4 flex-shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                'text-muted-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-destructive-muted)] hover:text-[var(--color-danger-400)]',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? 'Logout' : undefined}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        }
      >
        {/* Navigation */}
        <nav className="space-y-0.5 p-2" aria-label="Main navigation">
          {/* Primary nav items — always visible */}
          <div className="space-y-0.5" role="group" aria-label="Primary navigation">
            {enrichedItems.primary.map(renderNavItem)}
          </div>

          {/* Separator */}
          <div className="border-border my-1.5 border-t" />

          {/* "More" collapsible section */}
          <div>
            {!isCollapsed && (
              <button
                onClick={() => setMoreExpanded(!moreExpanded)}
                className="focus:ring-primary/20 hover:bg-muted/50 mb-0.5 flex w-full items-center justify-between rounded px-2 py-1 transition-colors focus:ring-1 focus:outline-none"
                aria-expanded={moreExpanded}
                aria-controls="nav-section-more"
                aria-label={`More navigation items, ${moreExpanded ? 'collapse' : 'expand'}`}
              >
                <h3 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                  More
                </h3>
                <motion.div
                  animate={shouldAnimate ? { rotate: moreExpanded ? 0 : -90 } : undefined}
                  transition={{ duration: 0.12 }}
                  aria-hidden="true"
                  style={{ willChange: 'transform' }}
                >
                  <ChevronDown className="text-muted-foreground h-3 w-3" />
                </motion.div>
              </button>
            )}

            <AnimatePresence initial={false}>
              {(isCollapsed || moreExpanded) && (
                <motion.div
                  id="nav-section-more"
                  initial={
                    isCollapsed
                      ? false
                      : shouldAnimate
                        ? { height: 0, opacity: 0 }
                        : { height: 'auto', opacity: 1 }
                  }
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldAnimate ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5 overflow-hidden"
                  role="group"
                  aria-label="More navigation links"
                  style={{ willChange: 'height, opacity' }}
                >
                  {enrichedItems.more.map(renderNavItem)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </SidebarShell>
      <LogoutConfirmDialog />
    </motion.aside>
  )
}
