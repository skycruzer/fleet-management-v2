import { redirect } from 'next/navigation'
import { getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Portal Layout
 * Shared layout for all pilot portal pages with authentication
 * Wrapped with ErrorBoundary for graceful error handling
 */

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - shared auth logic for all portal pages
  const pilotUser = await getCurrentPilotUser()

  if (!pilotUser) {
    redirect('/auth/login')
  }

  if (!pilotUser.registration_approved) {
    redirect('/auth/pending-approval')
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Error</h2>
              <p className="text-gray-600 mb-6">
                There was an error loading the pilot portal. Please refresh the page or contact support if the issue persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log portal-specific errors
        console.error('Portal Layout Error:', {
          error,
          errorInfo,
          pilotUser: pilotUser.id,
          timestamp: new Date().toISOString(),
        })
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <main id="main-content">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}
