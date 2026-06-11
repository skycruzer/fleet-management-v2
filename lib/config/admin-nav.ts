/**
 * Admin Navigation Config
 * Developer: Maurice Rondeau
 *
 * Single source of truth for admin portal navigation. Consumed by:
 * - components/layout/professional-sidebar-client.tsx (desktop: primary + "More" sections)
 * - app/dashboard/layout.tsx (mobile nav: all sections flattened, same order as desktop)
 *
 * Each consumer keeps its own rendering — only the data lives here.
 */

import type { ComponentType } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileCheck,
  FileSearch,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  RefreshCw,
  ScrollText,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react'

export type AdminNavSection = 'primary' | 'more' | 'header'

export interface AdminNavItem {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  section: AdminNavSection
}

/**
 * All admin nav items in display order: primary section first, then "More",
 * then header-only items. Settings/Help live in the desktop header, but the
 * header is hidden on mobile so the mobile nav includes them at the end.
 */
export const adminNavItems: AdminNavItem[] = [
  // Primary — always visible in the desktop sidebar
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'primary' },
  { title: 'Pilots', href: '/dashboard/pilots', icon: Users, section: 'primary' },
  {
    title: 'Certifications',
    href: '/dashboard/certifications',
    icon: FileCheck,
    section: 'primary',
  },
  // Approvals Hub replaces the separate Requests + Leave Bids entries — all
  // pending decisions (leave, RDO/SDO, bids, registrations) in one queue.
  { title: 'Approvals', href: '/dashboard/approvals', icon: ListChecks, section: 'primary' },
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, section: 'primary' },

  // Secondary — under the "More" expander in the desktop sidebar
  // Browse/history view of all requests (approvals moved to the hub)
  { title: 'Requests', href: '/dashboard/requests', icon: ClipboardList, section: 'more' },
  {
    title: 'Published Rosters',
    href: '/dashboard/published-rosters',
    icon: CalendarDays,
    section: 'more',
  },
  {
    title: 'Renewal Planning',
    href: '/dashboard/renewal-planning',
    icon: RefreshCw,
    section: 'more',
  },
  { title: 'Reports', href: '/dashboard/reports', icon: ScrollText, section: 'more' },
  { title: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, section: 'more' },
  { title: 'System Admin', href: '/dashboard/admin', icon: Shield, section: 'more' },
  { title: 'Disciplinary', href: '/dashboard/disciplinary', icon: AlertCircle, section: 'more' },
  { title: 'Audit Logs', href: '/dashboard/audit', icon: FileSearch, section: 'more' },
  { title: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare, section: 'more' },

  // Header-only on desktop — included on mobile because the header is hidden there
  { title: 'Help Center', href: '/dashboard/help', icon: HelpCircle, section: 'header' },
  { title: 'My Settings', href: '/dashboard/settings', icon: UserCircle, section: 'header' },
]

export const primaryAdminNavItems = adminNavItems.filter((item) => item.section === 'primary')
export const moreAdminNavItems = adminNavItems.filter((item) => item.section === 'more')
