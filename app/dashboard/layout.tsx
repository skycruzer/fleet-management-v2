/**
 * Dashboard Layout
 * Professional layout with sidebar and header
 * Enhanced with aviation-inspired design
 * Includes ErrorBoundary for graceful error handling
 */

import type { Metadata } from 'next'
import { getAppTitle } from '@/lib/services/admin-service'

export async function generateMetadata(): Promise<Metadata> {
  const appTitle = await getAppTitle()
  return {
    title: `Admin Dashboard | ${appTitle}`,
    description: 'Administrative dashboard for fleet management and pilot operations',
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Always fetch fresh data

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from '@/components/error-boundary'
import { ProfessionalSidebar } from '@/components/layout/professional-sidebar'
import { ProfessionalHeader } from '@/components/layout/professional-header'
import { MobileNav } from '@/components/navigation/mobile-nav'
import { SkipNav } from '@/components/accessibility/skip-nav'
import { GlobalAnnouncer } from '@/components/accessibility/announcer'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Settings,
  CheckSquare,
  AlertTriangle,
  Plane,
  ScrollText,
  RefreshCw,
} from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Navigation links for mobile navigation
  const navLinks = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
      label: 'Dashboard',
    },
    {
      href: '/dashboard/pilots',
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      label: 'Pilots',
    },
    {
      href: '/dashboard/certifications',
      icon: <FileText className="h-5 w-5" aria-hidden="true" />,
      label: 'Certifications',
    },
    {
      href: '/dashboard/leave',
      icon: <Calendar className="h-5 w-5" aria-hidden="true" />,
      label: 'Leave Requests',
    },
    {
      href: '/dashboard/flight-requests',
      icon: <Plane className="h-5 w-5" aria-hidden="true" />,
      label: 'Flight Requests',
    },
    {
      href: '/dashboard/renewal-planning',
      icon: <RefreshCw className="h-5 w-5" aria-hidden="true" />,
      label: 'Renewal Planning',
    },
    {
      href: '/dashboard/analytics',
      icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
      label: 'Analytics',
    },
    {
      href: '/dashboard/admin',
      icon: <Settings className="h-5 w-5" aria-hidden="true" />,
      label: 'Admin Dashboard',
    },
    {
      href: '/dashboard/tasks',
      icon: <CheckSquare className="h-5 w-5" aria-hidden="true" />,
      label: 'Tasks',
    },
    {
      href: '/dashboard/disciplinary',
      icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
      label: 'Disciplinary',
    },
    {
      href: '/dashboard/audit-logs',
      icon: <ScrollText className="h-5 w-5" aria-hidden="true" />,
      label: 'Audit Logs',
    },
    {
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" aria-hidden="true" />,
      label: 'My Settings',
    },
  ]

  return (
    <ErrorBoundary>
      <SkipNav />
      <GlobalAnnouncer />

      {/* Mobile Navigation */}
      <MobileNav user={user} navLinks={navLinks} />

      {/* Professional Layout */}
      <div className="flex min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-900">
        {/* Professional Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <ProfessionalSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden lg:ml-64">
          {/* Professional Header - Hidden on mobile */}
          <div className="hidden lg:block">
            <ProfessionalHeader />
          </div>

          {/* Page Content */}
          <main
            id="main-content"
            className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 p-6 dark:bg-slate-900"
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
