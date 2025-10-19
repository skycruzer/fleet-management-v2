/**
 * Leave Requests List Page
 * View all leave requests for the current pilot
 */

export const dynamic = 'force-dynamic'

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
              <h1 className="text-foreground text-2xl font-bold">My Leave Requests</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal/leave/new">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
            <p className="text-muted-foreground text-sm font-medium">Total Requests</p>
            <p className="text-foreground mt-2 text-3xl font-bold">{stats.total}</p>
          </Card>
          <Card className="border-primary/20 bg-primary/5 p-6">
            <p className="text-muted-foreground text-sm font-medium">Pending</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.pending}</p>
          </Card>
          <Card className="border-green-200 bg-green-50 p-6">
            <p className="text-muted-foreground text-sm font-medium">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{stats.approved}</p>
          </Card>
          <Card className="border-purple-200 bg-purple-50 p-6">
            <p className="text-muted-foreground text-sm font-medium">Total Days</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">{stats.totalDays}</p>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card className="bg-white p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">All Leave Requests</h2>

          {leaveRequests.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mb-4 block text-6xl">📅</span>
              <h3 className="text-foreground mb-2 text-xl font-semibold">No Leave Requests Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any leave requests. Get started by creating your first
                request.
              </p>
              <Link href="/portal/leave/new">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit Your First Leave Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="divide-border min-w-full divide-y">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Type
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Dates
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Days
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Roster Period
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Status
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y bg-white">
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="bg-muted text-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {request.request_type}
                        </span>
                      </td>
                      <td className="text-foreground px-4 py-4 text-sm whitespace-nowrap">
                        {format(new Date(request.start_date), 'MMM dd, yyyy')} →{' '}
                        {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                        {request.days_count}
                      </td>
                      <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                        {request.roster_period || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'PENDING'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
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
            <div className="text-muted-foreground mt-4 text-sm">
              Showing {leaveRequests.length} requests
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Leave Request Status</h3>
              <div className="text-card-foreground space-y-2 text-sm">
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
              <p className="text-muted-foreground mt-4 text-sm">
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
