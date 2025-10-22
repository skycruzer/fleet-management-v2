/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages
 * Includes sidebar navigation and header
 * Wrapped with ErrorBoundary for graceful error handling
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Fleet Management',
  description: 'Administrative dashboard for fleet management and pilot operations',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Always fetch fresh data

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/error-boundary'
import { getAppTitle } from '@/lib/services/admin-service'
import { DashboardNavLink } from '@/components/navigation/dashboard-nav-link'
import { MobileNav } from '@/components/navigation/mobile-nav'
import { SkipNav } from '@/components/accessibility/skip-nav'
import { GlobalAnnouncer } from '@/components/accessibility/announcer'
import { ThemeToggle } from '@/components/theme-toggle'
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
  ScrollText
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

  // Fetch app title from settings
  const appTitle = await getAppTitle()

  // Navigation links for both desktop and mobile
  const navLinks = [
    { href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />, label: 'Dashboard' },
    { href: '/dashboard/pilots', icon: <Users className="h-5 w-5" aria-hidden="true" />, label: 'Pilots' },
    { href: '/dashboard/certifications', icon: <FileText className="h-5 w-5" aria-hidden="true" />, label: 'Certifications' },
    { href: '/dashboard/leave', icon: <Calendar className="h-5 w-5" aria-hidden="true" />, label: 'Leave Requests' },
    { href: '/dashboard/flight-requests', icon: <Plane className="h-5 w-5" aria-hidden="true" />, label: 'Flight Requests' },
    { href: '/dashboard/tasks', icon: <CheckSquare className="h-5 w-5" aria-hidden="true" />, label: 'Tasks' },
    { href: '/dashboard/disciplinary', icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />, label: 'Disciplinary' },
    { href: '/dashboard/audit-logs', icon: <ScrollText className="h-5 w-5" aria-hidden="true" />, label: 'Audit Logs' },
    { href: '/dashboard/analytics', icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />, label: 'Analytics' },
    { href: '/dashboard/admin', icon: <Settings className="h-5 w-5" aria-hidden="true" />, label: 'Settings' },
  ]

  return (
    <ErrorBoundary>
      <SkipNav />
      <GlobalAnnouncer />

      {/* Mobile Navigation */}
      <MobileNav user={user} navLinks={navLinks} />

      <div className="bg-muted/50 flex h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:flex border-border bg-card w-64 flex-col border-r" role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <div className="border-border flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">FM</span>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-sm font-semibold">Admin Dashboard</span>
                <span className="text-muted-foreground text-xs">Fleet Management</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav id="main-navigation" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navLinks.map((link) => (
              <DashboardNavLink key={link.href} href={link.href} icon={link.icon}>
                {link.label}
              </DashboardNavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-border border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-card-foreground text-sm font-medium">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{user.email}</p>
                <form action="/api/auth/signout" method="POST">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-card-foreground h-6 px-0 text-xs"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Desktop Header - Hidden on mobile */}
          <header className="hidden lg:flex border-border bg-card h-16 items-center justify-between border-b px-6">
            <h1 className="text-foreground text-lg font-semibold" suppressHydrationWarning>
              {appTitle}
            </h1>
            <ThemeToggle />
          </header>

          {/* Page Content */}
          <main id="main-content" className="bg-muted/50 flex-1 overflow-y-auto p-4 sm:p-6" role="main" aria-label="Main content">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
