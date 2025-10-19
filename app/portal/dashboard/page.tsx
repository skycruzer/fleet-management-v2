/**
 * Pilot Dashboard Page
 * Personal stats, quick actions, and activity overview for pilots
 */

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getCurrentPilotUser,
  getPilotDashboardStats,
  getPilotCertifications,
  getPilotLeaveRequests,
  getPilotFlightRequests,
} from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

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
  const pilotUser = await getCurrentPilotUser()

  // Redirect if not a pilot or not approved
  if (!pilotUser) {
    redirect('/auth/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <Card className="max-w-md bg-white p-8 text-center">
          <div className="mb-4 text-6xl">⏳</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Registration Pending</h2>
          <p className="mb-4 text-gray-600">
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

  // Fetch all dashboard data in parallel
  const [stats, certifications, leaveRequests, flightRequests] = await Promise.all([
    getPilotDashboardStats(pilotUser.id),
    getPilotCertifications(pilotUser.id),
    getPilotLeaveRequests(pilotUser.id),
    getPilotFlightRequests(pilotUser.id),
  ])

  // Filter for expiring certifications (within 30 days)
  const expiringCertifications = certifications.filter(
    (cert) => cert.status.daysUntilExpiry >= 0 && cert.status.daysUntilExpiry <= 30
  )

  // Get recent leave requests (last 5)
  const recentLeaveRequests = leaveRequests.slice(0, 5)

  // Get recent flight requests (last 5)
  const recentFlightRequests = flightRequests.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-lg font-bold text-white">
                  {pilotUser.first_name.charAt(0)}
                  {pilotUser.last_name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome, {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
                </h1>
                <p className="text-xs text-gray-600">Employee ID: {pilotUser.employee_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal/feedback">
                <Button variant="outline">💬 Feedback</Button>
              </Link>
              <Link href="/portal">
                <Button variant="outline">← Back to Portal</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Leave Requests Stats */}
          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-4xl">📅</span>
              <span className="text-sm font-medium text-blue-600">
                {stats.pendingLeaveRequests} Pending
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Leave Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeaveRequests}</p>
              <p className="text-xs text-gray-500">
                {stats.approvedLeaveRequests} Approved • {stats.totalLeaveDays} Days
              </p>
            </div>
          </Card>

          {/* Certifications Stats */}
          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-4xl">📋</span>
              {stats.expiringCertifications > 0 && (
                <span className="text-sm font-medium text-yellow-600">
                  {stats.expiringCertifications} Expiring
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600">Certifications</h3>
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stats.activeCertifications}</p>
              <p className="text-xs text-gray-500">
                {stats.expiredCertifications > 0 && (
                  <span className="text-red-600">{stats.expiredCertifications} Expired • </span>
                )}
                Active & Current
              </p>
            </div>
          </Card>

          {/* Flight Requests Stats */}
          <Card className="bg-white p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-4xl">✈️</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Flight Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-bold text-gray-900">{flightRequests.length}</p>
              <p className="text-xs text-gray-500">
                {flightRequests.filter((r) => r.status === 'PENDING').length} Pending
              </p>
            </div>
          </Card>

          {/* Profile Completion */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Profile Status</h3>
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-bold text-green-700">Active</p>
              <p className="text-xs text-gray-600">All systems operational</p>
            </div>
          </Card>
        </div>

        {/* Expiring Certifications Alert */}
        {expiringCertifications.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {expiringCertifications.length} Certification
                  {expiringCertifications.length > 1 ? 's' : ''} Expiring Soon
                </h3>
                <div className="space-y-2">
                  {expiringCertifications.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {cert.check_type.check_description}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires:{' '}
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                          cert.status.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : cert.status.color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {cert.status.daysUntilExpiry} days left
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/portal/certifications">
                  <Button className="mt-4 bg-yellow-600 text-white hover:bg-yellow-700">
                    View All Certifications
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-8 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/portal/leave/new">
              <Button className="bg-primary hover:bg-primary/90 flex h-auto w-full flex-col items-center space-y-2 py-6 text-white">
                <span className="text-3xl">📅</span>
                <span className="font-semibold">Submit Leave Request</span>
                <span className="text-xs opacity-90">RDO, Annual, Sick Leave</span>
              </Button>
            </Link>
            <Link href="/portal/flights/new">
              <Button className="flex h-auto w-full flex-col items-center space-y-2 bg-indigo-600 py-6 text-white hover:bg-indigo-700">
                <span className="text-3xl">✈️</span>
                <span className="font-semibold">Submit Flight Request</span>
                <span className="text-xs opacity-90">Additional flights, route changes</span>
              </Button>
            </Link>
            <Link href="/portal/certifications">
              <Button className="flex h-auto w-full flex-col items-center space-y-2 bg-purple-600 py-6 text-white hover:bg-purple-700">
                <span className="text-3xl">📋</span>
                <span className="font-semibold">View Certifications</span>
                <span className="text-xs opacity-90">Check expiry dates</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Leave Requests */}
          <Card className="bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h3>
              <Link href="/portal/leave">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {recentLeaveRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p className="mb-2 text-4xl">📭</p>
                <p>No leave requests yet</p>
                <Link href="/portal/leave/new">
                  <Button className="mt-4" size="sm">
                    Submit Your First Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{request.request_type}</span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'PENDING'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {format(new Date(request.start_date), 'MMM dd')} -{' '}
                        {format(new Date(request.end_date), 'MMM dd, yyyy')} ({request.days_count}{' '}
                        days)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Flight Requests */}
          <Card className="bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Flight Requests</h3>
              <Link href="/portal/flights">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            {recentFlightRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p className="mb-2 text-4xl">📭</p>
                <p>No flight requests yet</p>
                <Link href="/portal/flights/new">
                  <Button className="mt-4" size="sm">
                    Submit Your First Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFlightRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{request.request_type}</span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'PENDING'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Flight Date: {format(new Date(request.flight_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">{request.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Need Help?</h3>
              <p className="mb-4 text-gray-600">
                If you have questions about the pilot portal or need assistance with certifications,
                leave requests, or flight requests, please contact fleet management.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="mailto:fleet@airniugini.com.pg"
                  className="text-sm text-blue-600 hover:underline"
                >
                  fleet@airniugini.com.pg
                </a>
                <span className="text-gray-400">•</span>
                <Link href="/portal/feedback" className="text-sm text-blue-600 hover:underline">
                  Submit Feedback
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2025 Air Niugini B767 Fleet Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
