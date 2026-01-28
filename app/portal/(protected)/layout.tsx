/**
 * Pilot Portal Protected Layout
 * Developer: Maurice Rondeau
 *
 * Uses session-service for pilot session validation.
 * Queries pilot_users for user details.
 * Redirects to /portal/change-password if must_change_password is true.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { validatePilotSession } from '@/lib/services/session-service'
import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/error-boundary'
import { PilotPortalSidebar } from '@/components/layout/pilot-portal-sidebar'
import { PortalToastHandler } from '@/components/portal/portal-toast-handler'
import { QueryProvider } from '@/lib/react-query/query-provider'

export const metadata: Metadata = {
  title: 'Pilot Portal | Fleet Management',
  description:
    'Self-service portal for pilots to manage certifications, leave requests, and flight requests',
}

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Validate pilot session from cookie
  const session = await validatePilotSession()

  if (!session.isValid || !session.userId) {
    redirect('/portal/login')
  }

  // Fetch pilot user details
  const supabase = await createClient()
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('first_name, last_name, employee_id, must_change_password')
    .eq('id', session.userId)
    .single()

  if (!pilotUser) {
    redirect('/portal/login')
  }

  // Force password change if required
  if (pilotUser.must_change_password) {
    redirect('/portal/change-password')
  }

  const pilotName = `${pilotUser.first_name} ${pilotUser.last_name}`
  const employeeId = pilotUser.employee_id || undefined

  return (
    <ErrorBoundary>
      <QueryProvider>
        <div className="bg-background flex min-h-screen">
          {/* Pilot Portal Sidebar */}
          <PilotPortalSidebar pilotName={pilotName} employeeId={employeeId} />

          {/* Main Content */}
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
