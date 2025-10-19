/**
 * Pilot Portal Landing Page
 * Entry point for pilot self-service portal
 */

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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">B767 Fleet Management</h1>
                <p className="text-xs text-gray-600">Pilot Self-Service Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/portal/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pilot Portal
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your certifications, submit leave requests, and stay connected with fleet
            operations—all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage Certifications
            </h3>
            <p className="text-gray-600 text-sm">
              View all your certifications, expiry dates, and receive alerts for upcoming
              renewals.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Leave Requests</h3>
            <p className="text-gray-600 text-sm">
              Request RDO, annual leave, or other time off directly through the portal.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flight Requests</h3>
            <p className="text-gray-600 text-sm">
              Submit requests for additional flights, route changes, or schedule preferences.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Dashboard</h3>
            <p className="text-gray-600 text-sm">
              Track your statistics, upcoming events, and important notifications at a glance.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback & Discussion</h3>
            <p className="text-gray-600 text-sm">
              Share feedback, participate in discussions, and stay informed with fleet updates.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Notifications</h3>
            <p className="text-gray-600 text-sm">
              Get instant updates on request approvals, certification expiries, and announcements.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="p-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Register now to access your pilot portal and take control of your fleet management
            needs.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/portal/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              >
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
          <p className="text-gray-600 text-sm">
            Need help? Contact fleet management at{' '}
            <a href="mailto:fleet@airniugini.com.pg" className="text-blue-600 hover:underline">
              fleet@airniugini.com.pg
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
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
