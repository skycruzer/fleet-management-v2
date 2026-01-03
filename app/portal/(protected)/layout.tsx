import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ErrorBoundary } from '@/components/error-boundary'
import { PilotPortalSidebar } from '@/components/layout/pilot-portal-sidebar'
import { PortalToastHandler } from '@/components/portal/portal-toast-handler'
import { QueryProvider } from '@/providers/query-provider'

/**
 * Portal Layout
 * Shared layout for all pilot portal pages with authentication
 * Wrapped with ErrorBoundary for graceful error handling
 */

export const metadata: Metadata = {
  title: 'Pilot Portal | Fleet Management',
  description:
    'Self-service portal for pilots to manage certifications, leave requests, and flight requests',
}

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Check authentication - shared auth logic for all portal pages
  const pilot = await getCurrentPilot()

  if (!pilot) {
    redirect('/portal/login')
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <div className="flex min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
          {/* Pilot Portal Sidebar */}
          <PilotPortalSidebar
            pilotName={`${pilot.first_name} ${pilot.last_name}`}
            pilotRank={pilot.rank || undefined}
            employeeId={pilot.employee_id || undefined}
            email={pilot.email || undefined}
          />

          {/* Main Content */}
          <main id="main-content" className="flex-1 pt-16 md:ml-64 md:pt-0">
            {children}
          </main>

          {/* Toast Notifications Handler */}
          <PortalToastHandler />
        </div>
      </QueryProvider>
    </ErrorBoundary>
  )
}
