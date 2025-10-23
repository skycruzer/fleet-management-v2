/**
 * Pilot Dashboard Page
 * /pilot/dashboard
 *
 * Server Component that fetches and displays pilot dashboard data.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import PilotDashboardContent from '@/components/pilot/PilotDashboardContent'
import NotificationBell from '@/components/pilot/NotificationBell'

export const metadata: Metadata = {
  title: 'Pilot Dashboard | Fleet Management',
  description: 'View your certifications, leave requests, and pilot information.',
}


// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'
/**
 * Pilot Dashboard Page
 * Server Component - requires authentication
 */
export default async function PilotDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/pilot/login')
  }

  // Check if user is an approved pilot
  const { data: pilotUser } = await supabase
    .from('pilot_users')
    .select('id, email, first_name, last_name, rank, registration_approved, employee_id')
    .eq('id', user.id)
    .single()

  if (!pilotUser) {
    redirect('/pilot/login')
  }

  if (!pilotUser.registration_approved) {
    // Registration pending approval
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Registration Pending
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your registration is awaiting administrator approval. You'll receive an email
            notification once your account has been approved.
          </p>
          <form action="/api/pilot/logout" method="POST" className="mt-6">
            <button
              type="submit"
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Fetch dashboard data
  const dashboardResult = await getPilotPortalStats(user.id)

  if (!dashboardResult.success || !dashboardResult.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <h2 className="mb-2 text-xl font-bold text-red-600">Error Loading Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dashboardResult.error || 'Unable to load dashboard data. Please try again later.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Pilot Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {pilotUser.first_name} {pilotUser.last_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <form action="/api/pilot/logout" method="POST">
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PilotDashboardContent dashboardData={dashboardResult.data} />
      </main>
    </div>
  )
}
