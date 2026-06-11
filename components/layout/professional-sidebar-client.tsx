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
import { motion } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { LogOut, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { SidebarShell } from '@/components/layout/sidebar-shell'
import { useSidebarBadges } from '@/lib/hooks/use-sidebar-badges'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useSidebarCollapse } from '@/lib/hooks/use-sidebar-collapse'
import { primaryAdminNavItems, moreAdminNavItems, type AdminNavItem } from '@/lib/config/admin-nav'

interface NavItem extends AdminNavItem {
  badge?: string
  badgeVariant?: 'default' | 'warning' | 'danger'
}

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
    const enrich = (items: AdminNavItem[]): NavItem[] =>
      items.map((item) => {
        if (item.title === 'Approvals' && badges?.pendingRequests) {
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
    return { primary: enrich(primaryAdminNavItems), more: enrich(moreAdminNavItems) }
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

  // Auto-expand "More" if user navigates to a secondary page
  useEffect(() => {
    const isOnMorePage = moreAdminNavItems.some((item) => isActive(item.href))
    if (isOnMorePage) {
      setMoreExpanded(true)
    }
  }, [pathname])

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
      <Link
        key={item.href}
        href={item.href}
        title={isCollapsed ? item.title : undefined}
        aria-current={active ? 'page' : undefined}
      >
        <div
          className={cn(
            'group relative flex min-h-[36px] items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-100',
            isCollapsed && 'justify-center px-0',
            active
              ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-active-foreground)]'
              : 'text-[var(--color-sidebar-foreground)] hover:bg-white/5 hover:text-white'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-colors',
              active
                ? 'text-[var(--color-sidebar-active-foreground)]'
                : 'text-[var(--color-sidebar-muted)] group-hover:text-white'
            )}
            aria-hidden="true"
          />

          {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}

          {/* Badge - Full text when expanded, dot when collapsed */}
          {item.badge && !isCollapsed && (
            <span
              className={cn(
                'flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                item.badgeVariant === 'warning' && 'bg-[#d97708] text-white',
                item.badgeVariant === 'danger' &&
                  'bg-[var(--color-sidebar-badge)] text-[var(--color-sidebar-badge-foreground)]',
                !item.badgeVariant &&
                  'bg-[var(--color-sidebar-badge)] text-[var(--color-sidebar-badge-foreground)]'
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
                item.badgeVariant === 'warning' && 'bg-[#d97708]',
                item.badgeVariant === 'danger' && 'bg-[var(--color-sidebar-badge)]',
                !item.badgeVariant && 'bg-[var(--color-sidebar-badge)]'
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
        'fixed top-0 left-0 z-[var(--z-sidebar)] h-screen border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] transition-[width] duration-200',
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
              'flex h-12 items-center gap-2 border-b border-[var(--color-sidebar-border)]',
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
                <h1 className="truncate text-sm font-semibold text-white" suppressHydrationWarning>
                  {appTitle}
                </h1>
              </div>
            )}
          </div>
        }
        footer={
          <div className="border-t border-[var(--color-sidebar-border)] p-2">
            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapse}
              className={cn(
                'mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--color-sidebar-foreground)] transition-colors hover:bg-white/5 hover:text-white',
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
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--color-sidebar-foreground)] transition-colors hover:bg-[rgba(201,55,44,0.2)] hover:text-[#ffb3ac]',
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
        <nav id="main-navigation" className="space-y-0.5 p-2" aria-label="Main navigation">
          {/* Primary nav items — always visible */}
          <div className="space-y-0.5" role="group" aria-label="Primary navigation">
            {enrichedItems.primary.map(renderNavItem)}
          </div>

          {/* Separator */}
          <div className="my-1.5 border-t border-[var(--color-sidebar-border)]" />

          {/* "More" collapsible section */}
          <div>
            {!isCollapsed && (
              <button
                onClick={() => setMoreExpanded(!moreExpanded)}
                className="mb-0.5 flex w-full items-center justify-between rounded px-2 py-1 transition-colors hover:bg-white/5 focus:ring-1 focus:ring-white/20 focus:outline-none"
                aria-expanded={moreExpanded}
                aria-controls="nav-section-more"
                aria-label={`More navigation items, ${moreExpanded ? 'collapse' : 'expand'}`}
              >
                <h3 className="text-xs font-semibold tracking-widest text-[var(--color-sidebar-muted)] uppercase">
                  More
                </h3>
                <motion.div
                  animate={shouldAnimate ? { rotate: moreExpanded ? 0 : -90 } : undefined}
                  transition={{ duration: 0.12 }}
                  aria-hidden="true"
                  style={{ willChange: 'transform' }}
                >
                  <ChevronDown className="h-3 w-3 text-[var(--color-sidebar-muted)]" />
                </motion.div>
              </button>
            )}

            {(isCollapsed || moreExpanded) && (
              <div
                id="nav-section-more"
                className="space-y-0.5"
                role="group"
                aria-label="More navigation links"
              >
                {enrichedItems.more.map(renderNavItem)}
              </div>
            )}
          </div>
        </nav>
      </SidebarShell>
      <LogoutConfirmDialog />
    </motion.aside>
  )
}
