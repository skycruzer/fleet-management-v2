/**
 * Dashboard Layout
 * Developer: Maurice Rondeau
 *
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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/services/admin-auth-service'
import { ErrorBoundary } from '@/components/error-boundary'
import { ProfessionalSidebar } from '@/components/layout/professional-sidebar'
import { ProfessionalHeader } from '@/components/layout/professional-header'
import { MobileNav } from '@/components/navigation/mobile-nav'
import { SkipNav } from '@/components/accessibility/skip-nav'
import { SidebarCollapseProvider } from '@/components/layout/sidebar-collapse-provider'
import { DashboardContentArea } from '@/components/layout/dashboard-content-area'
import { PageTransition } from '@/components/ui/page-transition'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ClipboardList,
  RefreshCw,
  BarChart3,
  Shield,
  CheckSquare,
  AlertCircle,
  ScrollText,
  HelpCircle,
  MessageSquare,
  UserCircle,
} from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check authentication - supports both Supabase Auth AND custom admin sessions
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no Supabase Auth user, check for admin session cookie (bcrypt-authenticated admins)
  let adminUser = null
  if (!user) {
    const adminSession = await validateAdminSession()
    if (adminSession.isValid && adminSession.user) {
      adminUser = adminSession.user
    }
  }

  // Redirect to login if neither auth method is valid
  if (!user && !adminUser) {
    redirect('/auth/login')
  }

  // Navigation links for mobile navigation
  const navLinks = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
      label: 'Dashboard',
    },
    {
      href: '/dashboard/pilots',
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      label: 'Pilots',
    },
    {
      href: '/dashboard/certifications',
      icon: <FileCheck className="h-4 w-4" aria-hidden="true" />,
      label: 'Certifications',
    },
    {
      href: '/dashboard/requests',
      icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
      label: 'Requests',
    },
    {
      href: '/dashboard/renewal-planning',
      icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
      label: 'Renewal Planning',
    },
    {
      href: '/dashboard/analytics',
      icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
      label: 'Analytics',
    },
    {
      href: '/dashboard/reports',
      icon: <ScrollText className="h-4 w-4" aria-hidden="true" />,
      label: 'Reports',
    },
    {
      href: '/dashboard/admin',
      icon: <Shield className="h-4 w-4" aria-hidden="true" />,
      label: 'System Admin',
    },
    {
      href: '/dashboard/tasks',
      icon: <CheckSquare className="h-4 w-4" aria-hidden="true" />,
      label: 'Tasks',
    },
    {
      href: '/dashboard/disciplinary',
      icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
      label: 'Disciplinary',
    },
    {
      href: '/dashboard/audit-logs',
      icon: <ScrollText className="h-4 w-4" aria-hidden="true" />,
      label: 'Audit Logs',
    },
    {
      href: '/dashboard/feedback',
      icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
      label: 'Feedback',
    },
    {
      href: '/dashboard/help',
      icon: <HelpCircle className="h-4 w-4" aria-hidden="true" />,
      label: 'Help Center',
    },
    {
      href: '/dashboard/settings',
      icon: <UserCircle className="h-4 w-4" aria-hidden="true" />,
      label: 'My Settings',
    },
  ]

  return (
    <ErrorBoundary>
      <SkipNav />

      {/* Mobile Navigation */}
      <MobileNav user={user ?? { email: adminUser?.email }} navLinks={navLinks} />

      {/* Professional Layout */}
      <SidebarCollapseProvider>
        <div className="bg-background flex min-h-screen overflow-x-hidden">
          {/* Professional Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <ProfessionalSidebar />
          </div>

          {/* Main Content Area — margin adjusts with sidebar collapse */}
          <DashboardContentArea>
            {/* Professional Header - Hidden on mobile */}
            <div className="hidden lg:block">
              <ProfessionalHeader />
            </div>

            {/* Page Content */}
            <main
              id="main-content"
              className="bg-background min-h-screen w-full max-w-full overflow-x-hidden p-4 lg:p-5"
              role="main"
              aria-label="Main content"
            >
              <PageTransition>{children}</PageTransition>
            </main>
          </DashboardContentArea>
        </div>
      </SidebarCollapseProvider>
    </ErrorBoundary>
  )
}
