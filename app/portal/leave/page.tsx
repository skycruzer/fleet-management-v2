/**
 * Leave Requests List Page
 * View all leave requests for the current pilot
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotUser, getPilotLeaveRequests } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function LeaveRequestsPage() {
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

  // Fetch all leave requests
  const leaveRequests = await getPilotLeaveRequests(pilotUser.id)

  // Calculate statistics
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
    approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    denied: leaveRequests.filter((r) => r.status === 'DENIED').length,
    totalDays: leaveRequests.reduce((sum, r) => sum + r.days_count, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
              <p className="mt-1 text-sm text-gray-600">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal/leave/new">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  + New Leave Request
                </Button>
              </Link>
              <Link href="/portal/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="bg-white p-6">
            <p className="text-sm font-medium text-gray-600">Total Requests</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.pending}</p>
          </Card>
          <Card className="border-green-200 bg-green-50 p-6">
            <p className="text-sm font-medium text-gray-600">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{stats.approved}</p>
          </Card>
          <Card className="border-purple-200 bg-purple-50 p-6">
            <p className="text-sm font-medium text-gray-600">Total Days</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">{stats.totalDays}</p>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card className="bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">All Leave Requests</h2>

          {leaveRequests.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mb-4 block text-6xl">📅</span>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No Leave Requests Yet</h3>
              <p className="mb-6 text-gray-600">
                You haven't submitted any leave requests. Get started by creating your first
                request.
              </p>
              <Link href="/portal/leave/new">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Submit Your First Leave Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Roster Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {request.request_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                        {format(new Date(request.start_date), 'MMM dd, yyyy')} →{' '}
                        {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                        {request.days_count}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
                        {request.roster_period || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'PENDING'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                        {request.created_at
                          ? format(new Date(request.created_at), 'MMM dd, yyyy')
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {leaveRequests.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {leaveRequests.length} requests
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Leave Request Status</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">PENDING:</span> Your request is under review by
                  fleet management
                </p>
                <p>
                  <span className="font-medium">APPROVED:</span> Your leave request has been
                  approved
                </p>
                <p>
                  <span className="font-medium">DENIED:</span> Your request was not approved (check
                  review comments)
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Questions?{' '}
                <a href="mailto:fleet@airniugini.com.pg" className="text-blue-600 hover:underline">
                  fleet@airniugini.com.pg
                </a>
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
