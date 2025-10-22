import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPilot } from '@/lib/services/pilot-portal-service'
import { ErrorBoundary } from '@/components/error-boundary'

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
  const result = await getCurrentPilot()

  if (!result.success || !result.data) {
    redirect('/portal/login')
  }

  const pilot = result.data

  // Check if pilot record exists (approved registration)
  if (!pilot) {
    redirect('/portal/login')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <main id="main-content">{children}</main>
      </div>
    </ErrorBoundary>
  )
}
