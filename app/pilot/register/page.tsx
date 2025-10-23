/**
 * Pilot Registration Page
 * /pilot/register
 *
 * Server Component that renders the pilot registration form.
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
import PilotRegisterForm from '@/components/pilot/PilotRegisterForm'

export const metadata: Metadata = {
  title: 'Pilot Registration | Fleet Management',
  description: 'Register for access to the pilot portal. Your registration will be reviewed by an administrator.',
}


// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'
/**
 * Pilot Registration Page
 * Server Component - checks if user is already authenticated
 */
export default async function PilotRegisterPage() {
  const supabase = await createClient()

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user is an approved pilot
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('id, registration_approved')
      .eq('id', user.id)
      .single()

    if (pilotUser?.registration_approved) {
      // Already registered and approved, redirect to dashboard
      redirect('/pilot/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Pilot Registration
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Register for access to the pilot portal. Your registration will be reviewed by an
            administrator.
          </p>
        </div>

        {/* Registration Form */}
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <PilotRegisterForm />

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/pilot/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Registration Process
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• Submit your registration with valid Air Niugini credentials</li>
            <li>• An administrator will review your application</li>
            <li>• You'll receive an email notification once approved</li>
            <li>• After approval, you can log in to access the pilot portal</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Air Niugini B767 Fleet Management System
        </p>
      </div>
    </div>
  )
}
