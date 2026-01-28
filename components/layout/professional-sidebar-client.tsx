'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

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
        title: 'Analytics & Reports',
        href: '/dashboard/analytics',
        icon: BarChart3,
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
        icon: ScrollText,
      },
      {
        title: 'Help & Feedback',
        href: '/dashboard/help',
        icon: HelpCircle,
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

  // Initialize state from localStorage
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

  return (
    <motion.aside
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed top-0 left-0 z-[var(--z-sidebar)] h-screen w-60 border-r border-white/[0.06] bg-[#0d1117]"
      style={{ willChange: 'transform' }}
    >
      {/* Logo Header */}
      <div className="flex h-12 items-center gap-2 border-b border-white/[0.06] px-4">
        <div className="bg-accent flex h-7 w-7 items-center justify-center rounded-md">
          <Plane className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <h1
            className="text-foreground truncate text-[13px] font-semibold"
            suppressHydrationWarning
          >
            {appTitle}
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        <div className="space-y-2">
          {navigationSections.map((section) => {
            const isCollapsed = collapsedSections[section.title]

            const sectionId = `nav-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`

            return (
              <div key={section.title}>
                {/* Section Header - Clickable to toggle */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="focus:ring-primary/20 mb-0.5 flex w-full items-center justify-between rounded px-2 py-1 transition-colors hover:bg-white/[0.04] focus:ring-1 focus:outline-none"
                  aria-expanded={!isCollapsed}
                  aria-controls={sectionId}
                  aria-label={`${section.title} navigation section, ${isCollapsed ? 'expand' : 'collapse'}`}
                >
                  <h3 className="text-[10px] font-medium tracking-widest text-white/30 uppercase">
                    {section.title}
                  </h3>
                  <motion.div
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.12 }}
                    aria-hidden="true"
                    style={{ willChange: 'transform' }}
                  >
                    <ChevronDown className="h-3 w-3 text-white/30" />
                  </motion.div>
                </button>

                {/* Section Items - Collapsible */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      id={sectionId}
                      initial={{ height: 0, opacity: 0 }}
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
                          <Link key={item.href} href={item.href}>
                            <div
                              className={cn(
                                'group relative flex min-h-[32px] items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors duration-100',
                                active
                                  ? 'bg-primary/15 text-primary border-primary border-l-2'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
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

                              <span className="flex-1 truncate">{item.title}</span>

                              {/* Badge - Linear style minimal */}
                              {item.badge && (
                                <span
                                  className={cn(
                                    'flex-shrink-0 rounded px-1 py-0.5 text-[10px] font-medium tabular-nums',
                                    item.badgeVariant === 'warning' && 'bg-warning/10 text-warning',
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
          <div className="mt-1 border-t border-white/[0.06] pt-2">
            {(() => {
              const Icon = settingsItem.icon
              const active = isActive(settingsItem.href)

              return (
                <Link href={settingsItem.href}>
                  <div
                    className={cn(
                      'group relative flex min-h-[32px] items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors duration-100',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground'
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

                    <span className="flex-1 truncate">{settingsItem.title}</span>
                  </div>
                </Link>
              )
            })()}
          </div>
        </div>
      </nav>

      {/* Bottom Section - Minimal */}
      <div className="border-t border-white/[0.06] p-2">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-muted-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}
