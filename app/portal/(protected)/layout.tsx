/**
 * Pilot Portal Protected Layout
 * Developer: Maurice Rondeau
 *
 * Uses session-service for pilot session validation.
 * Fetches pilot user details via pilot-portal-service (service layer).
 * Redirects to /portal/change-password if must_change_password is true.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { validatePilotSession } from '@/lib/services/session-service'
import { getPilotUserForLayout } from '@/lib/services/pilot-portal-service'
import { ErrorBoundary } from '@/components/error-boundary'
import { PilotBottomNav } from '@/components/layout/pilot-bottom-nav'
import { PilotPortalSidebar } from '@/components/layout/pilot-portal-sidebar'
import { PortalToastHandler } from '@/components/portal/portal-toast-handler'
import { QueryProvider } from '@/lib/react-query/query-provider'
import { SkipNav } from '@/components/accessibility/skip-nav'

export const metadata: Metadata = {
  title: 'B767 Pilot Portal',
  description:
    'Self-service portal for pilots to manage certifications, leave requests, and RDO/SDO requests',
}

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Validate pilot session from cookie
  const session = await validatePilotSession()

  if (!session.isValid || !session.userId) {
    redirect('/portal/login')
  }

  // Fetch pilot user details via service layer
  const pilotUserResult = await getPilotUserForLayout(session.userId)

  if (!pilotUserResult.success || !pilotUserResult.data) {
    redirect('/portal/login')
  }

  const pilotUser = pilotUserResult.data

  // Force password change if required
  if (pilotUser.must_change_password) {
    redirect('/portal/change-password')
  }

  const pilotName = `${pilotUser.first_name} ${pilotUser.last_name}`
  const employeeId = pilotUser.employee_id || undefined

  return (
    <ErrorBoundary>
      <SkipNav />
      <QueryProvider>
        <div className="bg-background flex min-h-screen">
          {/* Pilot Portal Sidebar */}
          <PilotPortalSidebar
            pilotName={pilotName}
            pilotRank={pilotUser.rank || undefined}
            employeeId={employeeId}
          />

          {/* Main Content — bottom padding clears the mobile bottom nav */}
          <main id="main-content" className="flex-1 pt-14 pb-16 lg:ml-60 lg:pt-0 lg:pb-0">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <PilotBottomNav />

          {/* Toast Notifications Handler */}
          <PortalToastHandler />
        </div>
      </QueryProvider>
    </ErrorBoundary>
  )
}
