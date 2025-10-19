/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages
 * Includes sidebar navigation and header
 * Wrapped with ErrorBoundary for graceful error handling
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-sm font-bold text-white">FM</span>
              </div>
              <span className="font-semibold text-gray-900">Fleet Mgmt</span>
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
              Admin
            </NavLink>
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                <span className="text-sm font-medium text-gray-600">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                <form action="/api/auth/signout" method="POST">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-0 text-xs text-gray-500 hover:text-gray-700"
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
          <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
            <h1 className="text-lg font-semibold text-gray-900">B767 Fleet Management</h1>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
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
      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
