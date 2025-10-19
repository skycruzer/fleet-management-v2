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
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your thoughts, suggestions, or concerns with fleet management
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Form Card */}
        <ErrorBoundary>
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <FeedbackForm
              pilotUser={{
                id: pilotUser.id,
                first_name: pilotUser.first_name,
                last_name: pilotUser.last_name,
                rank: pilotUser.rank || 'Unknown',
              }}
              categories={categories}
              csrfToken={csrfToken}
            />
          </div>
        </ErrorBoundary>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-blue-900">Guidelines for Feedback</h3>
              <ul className="space-y-2 text-sm text-blue-800">
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
