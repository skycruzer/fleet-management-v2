import { redirect } from 'next/navigation'
import { getCurrentPilotUser, getFeedbackCategories } from '@/lib/services/pilot-portal-service'
import { FeedbackForm } from '@/components/portal/feedback-form'
import { generateCsrfToken } from '@/lib/csrf'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function NewFeedbackPage() {
  const pilotUser = await getCurrentPilotUser()

  if (!pilotUser || !pilotUser.registration_approved) {
    redirect('/auth/login')
  }

  const categories = await getFeedbackCategories()
  const csrfToken = await generateCsrfToken()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your thoughts, suggestions, or concerns with fleet management
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Card */}
        <ErrorBoundary
          fallback={
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Loading Feedback Form
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading the feedback form. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
          onError={(error) => {
            console.error('Feedback Form Error:', {
              error,
              pilotUserId: pilotUser.id,
              timestamp: new Date().toISOString(),
            })
          }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <FeedbackForm
              pilotUser={{
                id: pilotUser.id,
                first_name: pilotUser.first_name,
                last_name: pilotUser.last_name,
                rank: pilotUser.rank,
              }}
              categories={categories}
              csrfToken={csrfToken}
            />
          </div>
        </ErrorBoundary>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Guidelines for Feedback</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li>✅ Be specific and constructive in your feedback</li>
                <li>✅ Use anonymous mode if you prefer privacy</li>
                <li>✅ Select an appropriate category to help organize feedback</li>
                <li>✅ Provide actionable suggestions when possible</li>
                <li>✅ Maintain professional and respectful tone</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
