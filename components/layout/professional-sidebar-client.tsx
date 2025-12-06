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
  ChevronRight,
  ChevronDown,
  Plane,
  BarChart3,
  AlertCircle,
  CheckSquare,
  Shield,
  ScrollText,
  UserCircle,
  RefreshCw,
  CalendarCheck,
  UserCheck,
  HelpCircle,
  MessageSquare,
  CalendarClock,
  CheckCircle,
  Settings,
  FileType,
  ClockAlert,
  FileText,
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
        badge: '12',
        badgeVariant: 'warning',
      },
      {
        title: 'Expiring Certs',
        href: '/dashboard/certifications/expiring',
        icon: ClockAlert,
        badge: '12',
        badgeVariant: 'danger',
      },
    ],
  },
  {
    title: 'Requests',
    items: [
      {
        title: 'Pilot Requests',
        href: '/dashboard/requests',
        icon: ClipboardList,
        badge: 'NEW',
        badgeVariant: 'default',
      },
      {
        title: 'Leave Approve',
        href: '/dashboard/leave/approve',
        icon: CheckCircle,
      },
      {
        title: 'Leave Calendar',
        href: '/dashboard/leave/calendar',
        icon: CalendarClock,
      },
      {
        title: 'Leave Bid Review',
        href: '/dashboard/admin/leave-bids',
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: 'Planning & Reports',
    items: [
      {
        title: 'Renewal Planning',
        href: '/dashboard/renewal-planning',
        icon: RefreshCw,
      },
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Admin Dashboard',
        href: '/dashboard/admin',
        icon: Shield,
      },
      {
        title: 'Admin Settings',
        href: '/dashboard/admin/settings',
        icon: Settings,
      },
      {
        title: 'Check Types',
        href: '/dashboard/admin/check-types',
        icon: FileType,
      },
      {
        title: 'Pilot Registrations',
        href: '/dashboard/admin/pilot-registrations',
        icon: UserCheck,
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
        title: 'FAQs',
        href: '/dashboard/faqs',
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
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-900"
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
          <Plane className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white" suppressHydrationWarning>
            {appTitle}
          </h1>
          <p className="text-xs text-slate-400">Operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <div className="space-y-4">
          {navigationSections.map((section) => {
            const isCollapsed = collapsedSections[section.title]

            return (
              <div key={section.title}>
                {/* Section Header - Clickable to toggle */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="mb-2 flex w-full items-center justify-between px-3 py-1 transition-colors hover:bg-slate-800/50 rounded-md"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </h3>
                  <motion.div
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </motion.div>
                </button>

                {/* Section Items - Collapsible */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)

                        return (
                          <Link key={item.href} href={item.href}>
                            <div
                              className={cn(
                                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                active
                                  ? 'bg-primary-600 text-white'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              )}
                            >
                              {/* Active indicator */}
                              {active && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="absolute left-0 h-8 w-1 rounded-r-full bg-accent-500"
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              )}

                              <Icon
                                className={cn(
                                  'h-5 w-5 transition-colors',
                                  active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                                )}
                              />

                              <span className="flex-1">{item.title}</span>

                              {/* Badge */}
                              {item.badge && (
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                                    item.badgeVariant === 'warning' &&
                                      'bg-warning-500/20 text-warning-400 ring-1 ring-warning-500/30',
                                    item.badgeVariant === 'danger' &&
                                      'bg-danger-500/20 text-danger-400 ring-1 ring-danger-500/30',
                                    !item.badgeVariant && 'bg-slate-700 text-slate-300'
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}

                              {/* Chevron on hover */}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Settings (standalone) */}
          <div className="border-t border-slate-700 pt-4">
            {(() => {
              const Icon = settingsItem.icon
              const active = isActive(settingsItem.href)

              return (
                <Link href={settingsItem.href}>
                  <div
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 h-8 w-1 rounded-r-full bg-accent-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      )}
                    />

                    <span className="flex-1">{settingsItem.title}</span>

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
            })()}
          </div>
        </div>
      </nav>

      {/* Bottom Section - Support CTA */}
      <div className="border-t border-slate-700 p-4">
        <div className="rounded-lg bg-primary-700 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-white" />
            <h3 className="font-semibold text-white">Need Help?</h3>
          </div>
          <p className="mb-3 text-sm text-slate-200">
            Contact our support team for assistance.
          </p>
          <Link
            href="/dashboard/support"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-slate-50"
          >
            Get Support
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}
