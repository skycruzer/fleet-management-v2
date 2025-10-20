/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages
 * Includes sidebar navigation and header
 * Wrapped with ErrorBoundary for graceful error handling
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Always fetch fresh data

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/error-boundary'
import { getAppTitle } from '@/lib/services/admin-service'

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

  return (
    <ErrorBoundary>
      <div className="bg-muted/50 flex h-screen">
        {/* Sidebar */}
        <aside className="border-border bg-card flex w-64 flex-col border-r">
          {/* Logo */}
          <div className="border-border flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary-foreground text-sm font-bold">FM</span>
              </div>
              <span className="text-foreground font-semibold">Fleet Mgmt</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            <NavLink href="/dashboard" icon="📊">
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/pilots" icon="👨‍✈️">
              Pilots
            </NavLink>
            <NavLink href="/dashboard/certifications" icon="📋">
              Certifications
            </NavLink>
            <NavLink href="/dashboard/leave" icon="📅">
              Leave Requests
            </NavLink>
            <NavLink href="/dashboard/analytics" icon="📈">
              Analytics
            </NavLink>
            <NavLink href="/dashboard/admin" icon="⚙️">
              Settings
            </NavLink>
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
          {/* Header */}
          <header className="border-border bg-card flex h-16 items-center border-b px-6">
            <h1 className="text-foreground text-lg font-semibold" suppressHydrationWarning>
              {appTitle}
            </h1>
          </header>

          {/* Page Content */}
          <main className="bg-muted/50 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-card-foreground hover:bg-muted hover:text-foreground flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
