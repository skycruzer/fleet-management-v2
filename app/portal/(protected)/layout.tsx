import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { ErrorBoundary } from '@/components/error-boundary'
import { PilotPortalSidebar } from '@/components/layout/pilot-portal-sidebar'
import { PortalToastHandler } from '@/components/portal/portal-toast-handler'
import { QueryProvider } from '@/lib/react-query/query-provider'

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
        <div className="bg-background flex min-h-screen">
          {/* Pilot Portal Sidebar */}
          <PilotPortalSidebar
            pilotName={`${pilot.first_name} ${pilot.last_name}`}
            pilotRank={pilot.rank || undefined}
            employeeId={pilot.employee_id || undefined}
            email={pilot.email || undefined}
          />

          {/* Main Content - uses lg breakpoint for consistency with admin portal */}
          <main id="main-content" className="flex-1 pt-16 lg:ml-60 lg:pt-0">
            {children}
          </main>

          {/* Toast Notifications Handler */}
          <PortalToastHandler />
        </div>
      </QueryProvider>
    </ErrorBoundary>
  )
}
