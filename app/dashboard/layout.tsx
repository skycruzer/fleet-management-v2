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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
              <p className="text-gray-600 mb-6">
                There was an error loading the dashboard. Please refresh the page or contact support if the issue persists.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <a
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard Home
                </a>
              </div>
            </div>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log dashboard-specific errors
        console.error('Dashboard Layout Error:', {
          error,
          errorInfo,
          userId: user?.id,
          userEmail: user?.email,
          timestamp: new Date().toISOString(),
        })
      }}
    >
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <span className="font-semibold text-gray-900">Fleet Mgmt</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            B767 Fleet Management
          </h1>
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
      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
