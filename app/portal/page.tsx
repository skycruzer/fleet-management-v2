/**
 * Pilot Portal Landing Page
 * Entry point for pilot self-service portal
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PilotPortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in as pilot, redirect to dashboard
  if (user) {
    const { data: pilotUser } = await supabase
      .from('pilot_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (pilotUser && pilotUser.registration_approved) {
      redirect('/portal/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-lg font-bold text-white">FM</span>
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold">B767 Fleet Management</h1>
                <p className="text-muted-foreground text-xs">Pilot Self-Service Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/portal/register">
                <Button className="bg-primary hover:bg-primary/90">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-foreground mb-4 text-4xl font-bold sm:text-5xl">
            Welcome to Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pilot Portal
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Manage your certifications, submit leave requests, and stay connected with fleet
            operations—all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">📋</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Manage Certifications</h3>
            <p className="text-muted-foreground text-sm">
              View all your certifications, expiry dates, and receive alerts for upcoming renewals.
            </p>
          </Card>

          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">📅</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Submit Leave Requests</h3>
            <p className="text-muted-foreground text-sm">
              Request RDO, annual leave, or other time off directly through the portal.
            </p>
          </Card>

          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">✈️</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Flight Requests</h3>
            <p className="text-muted-foreground text-sm">
              Submit requests for additional flights, route changes, or schedule preferences.
            </p>
          </Card>

          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Personal Dashboard</h3>
            <p className="text-muted-foreground text-sm">
              Track your statistics, upcoming events, and important notifications at a glance.
            </p>
          </Card>

          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">💬</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Feedback & Discussion</h3>
            <p className="text-muted-foreground text-sm">
              Share feedback, participate in discussions, and stay informed with fleet updates.
            </p>
          </Card>

          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-4 text-4xl">🔔</div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Real-time Notifications</h3>
            <p className="text-muted-foreground text-sm">
              Get instant updates on request approvals, certification expiries, and announcements.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center text-white">
          <h3 className="mb-4 text-3xl font-bold">Ready to Get Started?</h3>
          <p className="mx-auto mb-6 max-w-2xl text-blue-100">
            Register now to access your pilot portal and take control of your fleet management
            needs.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/portal/register">
              <Button size="lg" className="bg-white font-semibold text-blue-600 hover:bg-blue-50">
                Register Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            Need help? Contact fleet management at{' '}
            <a href="mailto:fleet@airniugini.com.pg" className="text-blue-600 hover:underline">
              fleet@airniugini.com.pg
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-muted-foreground text-center text-sm">
            <p>&copy; 2025 Air Niugini B767 Fleet Management. All rights reserved.</p>
            <p className="mt-2">
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                Admin Portal
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
