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
  description:
    'Log in to the pilot portal to access your dashboard, certifications, and leave requests.',
}

// Force dynamic rendering to prevent static generation at build time
export const dynamic = 'force-dynamic'

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
    <div className="from-primary/5 to-primary/15 flex min-h-screen items-center justify-center bg-gradient-to-br px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Pilot Portal</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in to access your dashboard and certifications
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-lg p-8 shadow-lg">
          <PilotLoginForm />

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{' '}
              <Link
                href="/pilot/register"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-xs">
          Air Niugini B767 Fleet Management System
        </p>
      </div>
    </div>
  )
}
