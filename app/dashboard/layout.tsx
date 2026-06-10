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
import { adminNavItems } from '@/lib/config/admin-nav'

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

  // Compute display name and email for header
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    (adminUser as Record<string, string> | null)?.display_name ||
    (adminUser as Record<string, string> | null)?.name ||
    'Admin'
  const userEmail = user?.email || (adminUser as Record<string, string> | null)?.email || ''

  // Mobile navigation derives from the shared admin nav config — all sections
  // flattened in desktop order (header/sidebar are hidden on mobile)
  const navLinks = adminNavItems.map(({ title, href, icon: Icon }) => ({
    href,
    icon: <Icon className="h-4 w-4" aria-hidden="true" />,
    label: title,
  }))

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
              <ProfessionalHeader userName={userName} userEmail={userEmail} />
            </div>

            {/* Page Content */}
            <main
              id="main-content"
              className="dashboard-layout bg-background mx-auto min-h-screen w-full max-w-screen-2xl overflow-x-hidden p-4 lg:p-5"
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
