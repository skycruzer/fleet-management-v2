import { redirect } from 'next/navigation'
import { getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Portal Layout
 * Shared layout for all pilot portal pages with authentication
 * Wrapped with ErrorBoundary for graceful error handling
 */

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Check authentication - shared auth logic for all portal pages
  const pilotUser = await getCurrentPilotUser()

  if (!pilotUser) {
    redirect('/auth/login')
  }

  if (!pilotUser.registration_approved) {
    redirect('/auth/pending-approval')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <main id="main-content">{children}</main>
      </div>
    </ErrorBoundary>
  )
}
