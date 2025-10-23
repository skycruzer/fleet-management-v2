/**
 * Pilot Notifications Page
 * /pilot/notifications
 *
 * Server Component that displays all notifications for the authenticated pilot.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPilotNotifications } from '@/lib/services/pilot-notification-service'
import NotificationList from '@/components/pilot/NotificationList'

export const metadata: Metadata = {
  title: 'Notifications | Pilot Portal',
  description: 'View all your notifications and updates.',
}


// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'
/**
 * Pilot Notifications Page
 * Server Component - requires authentication
 */
export default async function PilotNotificationsPage() {
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
    .select('id, registration_approved')
    .eq('id', user.id)
    .single()

  if (!pilotUser?.registration_approved) {
    redirect('/pilot/login')
  }

  // Fetch all notifications
  const notificationsResult = await getPilotNotifications(user.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View all your notifications and updates
            </p>
          </div>
          <Link
            href="/pilot/dashboard"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {notificationsResult.success && notificationsResult.data ? (
          <NotificationList
            notifications={notificationsResult.data}
            initialUnreadCount={notificationsResult.data.filter((n) => !n.is_read).length}
          />
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              {notificationsResult.error || 'Unable to load notifications. Please try again later.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
