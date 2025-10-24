'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Plane,
  BarChart3,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'warning' | 'danger'
}

const navigationItems: NavItem[] = [
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
    title: 'Leave Requests',
    href: '/dashboard/leave',
    icon: Calendar,
  },
  {
    title: 'Renewal Planning',
    href: '/dashboard/renewal-planning',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function ProfessionalSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <Plane className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Fleet Mgmt</h1>
          <p className="text-xs text-slate-400">B767 Operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
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
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section - Support CTA */}
      <div className="border-t border-slate-700 p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent-400" />
            <h3 className="font-semibold text-white">Need Help?</h3>
          </div>
          <p className="mb-3 text-sm text-slate-200">
            Contact our support team for assistance.
          </p>
          <Link
            href="/dashboard/support"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-all hover:bg-slate-50"
          >
            Get Support
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
