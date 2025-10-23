/**
 * Pilot Dashboard Page
 * Personal stats, quick actions, and activity overview for pilots
 *
 * TEMPORARY SIMPLIFIED VERSION
 * TODO: Implement full dashboard with:
 * - getPilotDashboardStats()
 * - getPilotCertifications()
 * - getPilotLeaveRequests()
 * - getPilotFlightRequests()
 */

export const dynamic = 'force-dynamic'

import { portalMetadata } from '@/lib/utils/metadata'
import { redirect } from 'next/navigation'

export const metadata = portalMetadata.dashboard
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot, getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import {
  Clock,
  MessageSquare,
  Calendar,
  FileText,
  Plane,
  CheckCircle,
  AlertTriangle,
  UserCircle,
  XCircle,
} from 'lucide-react'

export default async function PilotDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  // Get pilot user data
  const pilotResult = await getCurrentPilot()

  // Redirect if not a pilot or not approved
  if (!pilotResult.success || !pilotResult.data) {
    redirect('/portal/login')
  }

  const pilotUser = pilotResult.data
  if (!pilotUser) {
    redirect('/auth/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <Clock className="h-16 w-16 text-blue-600" aria-hidden="true" />
          </div>
          <h2 className="text-foreground mb-2 text-2xl font-bold">Registration Pending</h2>
          <p className="text-muted-foreground mb-4">
            Your pilot portal registration is pending approval by fleet management. You will receive
            an email once your account is activated.
          </p>
          <Link href="/portal">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Fetch pilot portal stats using the pilots table ID
  const statsResult = await getPilotPortalStats(pilotUser.pilot_id || pilotUser.id)
  const stats = statsResult.success && statsResult.data ? statsResult.data : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold">
                  Welcome, {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
                </h1>
                <p className="text-muted-foreground text-xs">
                  Pilot Portal • Employee ID: {pilotUser.employee_id || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/portal/profile">
                <Button variant="outline">
                  <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Profile
                </Button>
              </Link>
              <Link href="/portal/feedback">
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                  Feedback
                </Button>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">🎉 Login Successful!</h2>
                <p className="text-muted-foreground mb-4">
                  You have successfully logged into the Pilot Portal. Your account is approved and
                  active.
                </p>
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Email:</strong> {pilotUser.email}
                  </p>
                  <p>
                    <strong>Rank:</strong> {pilotUser.rank}
                  </p>
                  <p>
                    <strong>Employee ID:</strong> {pilotUser.employee_id || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Certification Warnings */}
        {((stats?.expired_certifications || 0) > 0 || (stats?.critical_certifications || 0) > 0) && (
          <div className="mb-8 space-y-4">
            {/* Expired Certifications Alert */}
            {(stats?.expired_certifications || 0) > 0 && (
              <Card className="border-red-300 bg-gradient-to-r from-red-50 to-red-100 p-6">
                <div className="flex items-start space-x-4">
                  <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-foreground mb-2 text-xl font-semibold text-red-900">
                      ⚠️ Expired Certifications
                    </h2>
                    <p className="mb-4 text-red-800">
                      You have {stats?.expired_certifications || 0} expired certification
                      {(stats?.expired_certifications || 0) !== 1 ? 's' : ''}. Please renew immediately.
                    </p>
                    {stats?.expired_certifications_details &&
                      stats.expired_certifications_details.length > 0 && (
                        <div className="space-y-2">
                          {stats.expired_certifications_details.map((check) => {
                            const expiryDate = new Date(check.expiry_date)
                            const today = new Date()
                            const daysExpired = Math.abs(
                              Math.ceil(
                                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                              )
                            )

                            return (
                              <div
                                key={check.id}
                                className="flex items-start justify-between rounded border border-red-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-red-900">{check.check_code}</p>
                                  <p className="text-sm text-red-700">{check.check_description}</p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-red-600">
                                    Expired {daysExpired} days ago
                                  </p>
                                  <p className="text-sm text-red-500">
                                    {expiryDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            )}

            {/* Critical Certifications Alert (< 2 weeks) */}
            {(stats?.critical_certifications || 0) > 0 && (
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-foreground mb-2 text-xl font-semibold text-orange-900">
                      🚨 Critical: Certifications Expiring Soon
                    </h2>
                    <p className="mb-4 text-orange-800">
                      You have {stats?.critical_certifications || 0} certification
                      {(stats?.critical_certifications || 0) !== 1 ? 's' : ''} expiring within the next 2
                      weeks. Action required.
                    </p>
                    {stats?.critical_certifications_details &&
                      stats.critical_certifications_details.length > 0 && (
                        <div className="space-y-2">
                          {stats.critical_certifications_details.map((check) => {
                            const expiryDate = new Date(check.expiry_date)
                            const today = new Date()
                            const daysUntil = Math.ceil(
                              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                            )

                            return (
                              <div
                                key={check.id}
                                className="flex items-start justify-between rounded border border-orange-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-orange-900">
                                    {check.check_code}
                                  </p>
                                  <p className="text-sm text-orange-700">
                                    {check.check_description}
                                  </p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-orange-600">
                                    {daysUntil} days remaining
                                  </p>
                                  <p className="text-sm text-orange-500">
                                    {expiryDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Certifications */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Active Certifications</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">
                {stats?.active_certifications || 0}
              </p>
              <p className="text-muted-foreground text-xs">Current certifications</p>
            </div>
          </Card>

          {/* Pending Leave Requests */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Calendar className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Leave Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">
                {stats?.pending_leave_requests || 0}
              </p>
              <p className="text-muted-foreground text-xs">Pending requests</p>
            </div>
          </Card>

          {/* Flight Requests */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Plane className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Flight Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">
                {stats?.pending_flight_requests || 0}
              </p>
              <p className="text-muted-foreground text-xs">Pending requests</p>
            </div>
          </Card>

          {/* Upcoming Checks */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-yellow-600" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Upcoming Checks</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">{stats?.upcoming_checks || 0}</p>
              <p className="text-muted-foreground text-xs">Within 60 days</p>

              {/* Show upcoming check details */}
              {stats?.upcoming_checks_details && stats.upcoming_checks_details.length > 0 && (
                <div className="mt-4 space-y-2 border-t pt-3">
                  {stats.upcoming_checks_details.map((check) => {
                    const expiryDate = new Date(check.expiry_date)
                    const today = new Date()
                    const daysUntil = Math.ceil(
                      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    )

                    return (
                      <div key={check.id} className="flex items-start justify-between text-xs">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{check.check_code}</p>
                          <p className="text-gray-600">{check.check_description}</p>
                        </div>
                        <div className="ml-2 text-right">
                          <p className="font-semibold text-yellow-700">{daysUntil} days</p>
                          <p className="text-gray-500">
                            {expiryDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/portal/profile">
              <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                <UserCircle className="mb-3 h-10 w-10 text-purple-600" aria-hidden="true" />
                <h3 className="text-foreground mb-1 font-semibold">My Profile</h3>
                <p className="text-muted-foreground text-sm">View personal information</p>
              </Card>
            </Link>

            <Link href="/portal/leave-requests">
              <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                <Calendar className="mb-3 h-10 w-10 text-blue-600" aria-hidden="true" />
                <h3 className="text-foreground mb-1 font-semibold">Leave Requests</h3>
                <p className="text-muted-foreground text-sm">Submit and manage leave requests</p>
              </Card>
            </Link>

            <Link href="/portal/flight-requests">
              <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                <Plane className="mb-3 h-10 w-10 text-indigo-600" aria-hidden="true" />
                <h3 className="text-foreground mb-1 font-semibold">Flight Requests</h3>
                <p className="text-muted-foreground text-sm">
                  Submit flight requests and preferences
                </p>
              </Card>
            </Link>

            <Link href="/portal/certifications">
              <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                <FileText className="mb-3 h-10 w-10 text-green-600" aria-hidden="true" />
                <h3 className="text-foreground mb-1 font-semibold">Certifications</h3>
                <p className="text-muted-foreground text-sm">View your certification status</p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Fleet Statistics */}
        <Card className="p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Fleet Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
              <div>
                <p className="text-muted-foreground text-sm">Total Pilots</p>
                <p className="text-foreground text-xl font-bold">{stats?.total_pilots || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div>
                <p className="text-muted-foreground text-sm">Total Captains</p>
                <p className="text-foreground text-xl font-bold">{stats?.total_captains || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-indigo-600" aria-hidden="true" />
              <div>
                <p className="text-muted-foreground text-sm">Total First Officers</p>
                <p className="text-foreground text-xl font-bold">
                  {stats?.total_first_officers || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
