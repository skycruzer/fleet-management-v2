/**
 * Pilot Login Page
 * /pilot/login
 *
 * Server Component that renders the pilot login form.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PilotLoginForm from '@/components/pilot/PilotLoginForm'

export const metadata: Metadata = {
  title: 'Pilot Login | Fleet Management',
  description: 'Log in to the pilot portal to access your dashboard, certifications, and leave requests.',
}

/**
 * Pilot Login Page
 * Server Component - checks if user is already authenticated
 */
export default async function PilotLoginPage() {
  const supabase = await createClient()

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user is a pilot
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('id, registration_approved')
      .eq('id', user.id)
      .single()

    if (pilotUser?.registration_approved) {
      // Already logged in as approved pilot, redirect to dashboard
      redirect('/pilot/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Pilot Portal
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard and certifications
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <PilotLoginForm />

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/pilot/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Air Niugini B767 Fleet Management System
        </p>
      </div>
    </div>
  )
}
