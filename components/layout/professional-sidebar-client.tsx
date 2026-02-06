/**
 * Professional Sidebar Client
 * Developer: Maurice Rondeau
 *
 * Admin sidebar with collapsible behavior, section grouping, and theme-aware colors.
 * Expanded: 240px (w-60) — shows icons + labels + section headers
 * Collapsed: 56px (w-14) — shows icons only with tooltips on hover
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  LogOut,
  ChevronDown,
  Plane,
  BarChart3,
  AlertCircle,
  CheckSquare,
  Shield,
  ScrollText,
  UserCircle,
  RefreshCw,
  HelpCircle,
  ClipboardList,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
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

interface NavSection {
  title: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Pilots',
        href: '/dashboard/pilots',
        icon: Users,
      },
      {
        title: 'Certifications',
        href: '/dashboard/certifications',
        icon: FileCheck,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Requests',
        href: '/dashboard/requests',
        icon: ClipboardList,
      },
      {
        title: 'Renewal Planning',
        href: '/dashboard/renewal-planning',
        icon: RefreshCw,
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: ScrollText,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'System Admin',
        href: '/dashboard/admin',
        icon: Shield,
      },
      {
        title: 'Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        title: 'Disciplinary',
        href: '/dashboard/disciplinary',
        icon: AlertCircle,
      },
      {
        title: 'Audit Logs',
        href: '/dashboard/audit-logs',
        icon: ClipboardList,
      },
      {
        title: 'Help Center',
        href: '/dashboard/help',
        icon: HelpCircle,
      },
      {
        title: 'Feedback',
        href: '/dashboard/feedback',
        icon: MessageSquare,
      },
    ],
  },
]

// Standalone settings item (not in a section)
const settingsItem: NavItem = {
  title: 'My Settings',
  href: '/dashboard/settings',
  icon: UserCircle,
}

interface ProfessionalSidebarClientProps {
  appTitle: string
  userRole: string | null
}

export function ProfessionalSidebarClient({ appTitle }: ProfessionalSidebarClientProps) {
  const { csrfToken } = useCsrfToken()
  const pathname = usePathname()
  const { data: badges } = useSidebarBadges()
  const { confirm, ConfirmDialog: LogoutConfirmDialog } = useConfirm()
  const { isCollapsed, toggleCollapse } = useSidebarCollapse()

  // Compute navigation sections with dynamic badge data
  const dynamicNavigationSections = useMemo<NavSection[]>(() => {
    return navigationSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
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
      }),
    }))
  }, [badges])

  // Initialize state from localStorage (section collapse, not sidebar collapse)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    const saved = localStorage.getItem('sidebar-collapsed-sections')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse sidebar state:', e)
        return {}
      }
    }
    return {}
  })

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(collapsedSections))
  }, [collapsedSections])

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }))
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
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
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      if (response.ok || response.redirected) {
        window.location.href = '/auth/login'
      } else {
        console.error('Logout failed')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
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

  return (
    <motion.aside
      initial={{ x: -240 }}
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
            <div className="bg-accent flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1
                  className="text-foreground truncate text-[13px] font-semibold"
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
                'text-muted-foreground hover:bg-muted/50 hover:text-foreground mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
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
                'text-muted-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--color-destructive-muted)] hover:text-[var(--color-danger-400)]',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        }
      >
        {/* Navigation */}
        <nav className="space-y-0.5 p-2">
          <div className="space-y-2">
            {dynamicNavigationSections.map((section) => {
              const isSectionCollapsed = collapsedSections[section.title]

              const sectionId = `nav-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`

              return (
                <div key={section.title}>
                  {/* Section Header - Clickable to toggle (hidden when sidebar is collapsed) */}
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="focus:ring-primary/20 hover:bg-muted/50 mb-0.5 flex w-full items-center justify-between rounded px-2 py-1 transition-colors focus:ring-1 focus:outline-none"
                      aria-expanded={!isSectionCollapsed}
                      aria-controls={sectionId}
                      aria-label={`${section.title} navigation section, ${isSectionCollapsed ? 'expand' : 'collapse'}`}
                    >
                      <h3 className="text-muted-foreground/40 text-[10px] font-medium tracking-widest uppercase">
                        {section.title}
                      </h3>
                      <motion.div
                        animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.12 }}
                        aria-hidden="true"
                        style={{ willChange: 'transform' }}
                      >
                        <ChevronDown className="text-muted-foreground/40 h-3 w-3" />
                      </motion.div>
                    </button>
                  )}

                  {/* Section Items - Collapsible (always shown when sidebar collapsed) */}
                  <AnimatePresence initial={false}>
                    {(isCollapsed || !isSectionCollapsed) && (
                      <motion.div
                        id={sectionId}
                        initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-0.5 overflow-hidden"
                        role="group"
                        aria-label={`${section.title} navigation links`}
                        style={{ willChange: 'height, opacity' }}
                      >
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const active = isActive(item.href)

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              title={isCollapsed ? item.title : undefined}
                            >
                              <div
                                className={cn(
                                  'group relative flex min-h-[32px] items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors duration-100',
                                  isCollapsed && 'justify-center px-0',
                                  active
                                    ? 'bg-primary/15 text-primary border-primary border-l-2'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                              >
                                <Icon
                                  className={cn(
                                    'h-4 w-4 flex-shrink-0 transition-colors',
                                    active
                                      ? 'text-primary'
                                      : 'text-muted-foreground/70 group-hover:text-foreground'
                                  )}
                                  aria-hidden="true"
                                />

                                {!isCollapsed && (
                                  <span className="flex-1 truncate">{item.title}</span>
                                )}

                                {/* Badge - Full text when expanded, dot when collapsed */}
                                {item.badge && !isCollapsed && (
                                  <span
                                    className={cn(
                                      'flex-shrink-0 rounded px-1 py-0.5 text-[10px] font-medium tabular-nums',
                                      item.badgeVariant === 'warning' &&
                                        'bg-warning/10 text-warning',
                                      item.badgeVariant === 'danger' &&
                                        'bg-destructive/10 text-destructive',
                                      !item.badgeVariant &&
                                        'bg-muted-foreground/10 text-muted-foreground'
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
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}

            {/* Settings (standalone) */}
            <div className="border-border mt-1 border-t pt-2">
              {(() => {
                const Icon = settingsItem.icon
                const active = isActive(settingsItem.href)

                return (
                  <Link
                    href={settingsItem.href}
                    title={isCollapsed ? settingsItem.title : undefined}
                  >
                    <div
                      className={cn(
                        'group relative flex min-h-[32px] items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors duration-100',
                        isCollapsed && 'justify-center px-0',
                        active
                          ? 'bg-primary/15 text-primary border-primary border-l-2'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground/70 group-hover:text-foreground'
                        )}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate">{settingsItem.title}</span>
                      )}
                    </div>
                  </Link>
                )
              })()}
            </div>
          </div>
        </nav>
      </SidebarShell>
      <LogoutConfirmDialog />
    </motion.aside>
  )
}
