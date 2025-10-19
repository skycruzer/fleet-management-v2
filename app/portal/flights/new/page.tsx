/**
 * Flight Request Submission Page
 * Allows pilots to submit flight requests (additional flights, route changes, schedule preferences, pickup requests)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { FlightRequestForm } from '@/components/portal/flight-request-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { generateCsrfToken } from '@/lib/csrf'

export default async function NewFlightRequestPage() {
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
              <h1 className="text-2xl font-bold text-gray-900">Submit Flight Request</h1>
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
              <h3 className="font-semibold text-gray-900 mb-2">Flight Request Guidelines</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Additional flight requests are subject to crew availability and operational needs</li>
                <li>• Route change requests require minimum 72 hours notice when possible</li>
                <li>• Schedule preference requests are considered during roster planning</li>
                <li>• Pickup requests should specify exact flight details and justification</li>
                <li>• All requests are reviewed by fleet management within 48 hours</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Flight Request Form */}
        <Card className="p-8 bg-white">
          <FlightRequestForm pilotUser={pilotUser} csrfToken={csrfToken} />
        </Card>

        {/* Help Section */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-3">
                If you have questions about flight requests, operational requirements, or the approval process:
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
