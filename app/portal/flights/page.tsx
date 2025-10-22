/**
 * Flight Requests List Page
 * View all flight requests for the current pilot
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilotUser, getPilotFlightRequests } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function FlightRequestsPage() {
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

  // Fetch all flight requests
  const flightRequests = await getPilotFlightRequests(pilotUser.id)

  // Calculate statistics
  const stats = {
    total: flightRequests.length,
    pending: flightRequests.filter((r) => r.status === 'PENDING').length,
    approved: flightRequests.filter((r) => r.status === 'APPROVED').length,
    denied: flightRequests.filter((r) => r.status === 'DENIED').length,
  }

  // Group by request type
  const typeBreakdown = {
    additional: flightRequests.filter((r) => r.request_type === 'ADDITIONAL_FLIGHT').length,
    routeChange: flightRequests.filter((r) => r.request_type === 'ROUTE_CHANGE').length,
    schedule: flightRequests.filter((r) => r.request_type === 'SCHEDULE_PREFERENCE').length,
    pickup: flightRequests.filter((r) => r.request_type === 'PICKUP_REQUEST').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Flight Requests</h1>
              <p className="mt-1 text-sm text-gray-600">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal/flights/new">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  + New Flight Request
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
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-gray-600">Denied</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.denied}</p>
          </Card>
        </div>

        {/* Request Type Breakdown */}
        <Card className="mb-8 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Requests by Type</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{typeBreakdown.additional}</p>
              <p className="mt-1 text-xs text-gray-600">Additional Flights</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{typeBreakdown.routeChange}</p>
              <p className="mt-1 text-xs text-gray-600">Route Changes</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{typeBreakdown.schedule}</p>
              <p className="mt-1 text-xs text-gray-600">Schedule Preferences</p>
            </div>
            <div className="rounded-lg bg-teal-50 p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">{typeBreakdown.pickup}</p>
              <p className="mt-1 text-xs text-gray-600">Pickup Requests</p>
            </div>
          </div>
        </Card>

        {/* Flight Requests Table */}
        <Card className="bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">All Flight Requests</h2>

          {flightRequests.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mb-4 block text-6xl">✈️</span>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No Flight Requests Yet</h3>
              <p className="mb-6 text-gray-600">
                You haven't submitted any flight requests. Get started by creating your first
                request.
              </p>
              <Link href="/portal/flights/new">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Submit Your First Flight Request
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
                      Flight Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Details
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
                  {flightRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            request.request_type === 'ADDITIONAL_FLIGHT'
                              ? 'bg-blue-100 text-blue-800'
                              : request.request_type === 'ROUTE_CHANGE'
                                ? 'bg-purple-100 text-purple-800'
                                : request.request_type === 'SCHEDULE_PREFERENCE'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {request.request_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">
                        {format(new Date(request.flight_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="max-w-md">
                          {request.route && (
                            <p className="font-medium text-gray-900">{request.route}</p>
                          )}
                          {request.flight_number && (
                            <p className="text-xs text-gray-500">Flight {request.flight_number}</p>
                          )}
                          <p className="truncate">{request.description}</p>
                        </div>
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
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {flightRequests.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {flightRequests.length} requests
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Flight Request Status</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">PENDING:</span> Your request is under review by
                  fleet management
                </p>
                <p>
                  <span className="font-medium">APPROVED:</span> Your flight request has been
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
