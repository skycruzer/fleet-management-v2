/**
 * Leave Request Submission Page
 * Allows pilots to submit leave requests (RDO, Annual, Sick, etc.)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { LeaveRequestForm } from '@/components/portal/leave-request-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { generateCsrfToken } from '@/lib/csrf'
import { ErrorBoundary } from '@/components/error-boundary'

export default async function NewLeaveRequestPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Get pilot user data
  const pilotUser = await getCurrentPilotUser()

  // Redirect if not a pilot or not approved
  if (!pilotUser || !pilotUser.registration_approved) {
    redirect('/portal/dashboard')
  }

  const csrfToken = await generateCsrfToken()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submit Leave Request</h1>
              <p className="text-sm text-gray-600 mt-1">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
              </p>
            </div>
            <Link href="/portal/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Leave Request Guidelines</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Leave requests must align with 28-day roster periods</li>
                <li>• RDO requests should be submitted at least 7 days in advance</li>
                <li>• Annual leave requires 14 days notice for approval consideration</li>
                <li>• Approval is subject to minimum crew requirements (10 Captains + 10 First Officers)</li>
                <li>• Requests are approved based on seniority if multiple pilots request overlapping dates</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Leave Request Form */}
        <ErrorBoundary
          fallback={
            <Card className="p-8 bg-white border-red-200">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Loading Leave Request Form
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading the leave request form. Please try refreshing the page.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                  <Link href="/portal/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
            </Card>
          }
          onError={(error) => {
            console.error('Leave Request Form Error:', {
              error,
              pilotUserId: pilotUser.id,
              pilotRank: pilotUser.rank,
              timestamp: new Date().toISOString(),
            })
          }}
        >
          <Card className="p-8 bg-white">
            <LeaveRequestForm pilotUser={pilotUser} csrfToken={csrfToken} />
          </Card>
        </ErrorBoundary>

        {/* Help Section */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-3">
                If you have questions about leave eligibility, roster periods, or the approval process:
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <a
                  href="mailto:fleet@airniugini.com.pg"
                  className="text-purple-600 hover:underline font-medium"
                >
                  fleet@airniugini.com.pg
                </a>
                <span className="text-gray-400">•</span>
                <Link href="/portal/feedback" className="text-purple-600 hover:underline font-medium">
                  Submit Feedback
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
