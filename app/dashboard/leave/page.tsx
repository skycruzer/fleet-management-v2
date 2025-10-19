/**
 * Leave Requests Page
 * Manage pilot leave requests and approvals
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getAllLeaveRequests } from '@/lib/services/leave-service'
import { format } from 'date-fns'

export default async function LeaveRequestsPage() {
  // Fetch leave requests data
  const requests = await getAllLeaveRequests()

  // Calculate stats from the data
  const stats = requests.reduce(
    (acc, req) => {
      acc.total++
      if (req.status === 'PENDING') acc.pending++
      else if (req.status === 'APPROVED') acc.approved++
      else if (req.status === 'DENIED') acc.denied++
      acc.totalDays += req.days_count
      return acc
    },
    { total: 0, pending: 0, approved: 0, denied: 0, totalDays: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Leave Requests</h2>
          <p className="text-muted-foreground mt-1">Submit and manage pilot leave requests</p>
        </div>
        <Link href="/dashboard/leave/new">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            Submit Leave Request
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.pending}</p>
              <p className="text-muted-foreground text-sm font-medium">Pending Requests</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.approved}</p>
              <p className="text-muted-foreground text-sm font-medium">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.denied}</p>
              <p className="text-muted-foreground text-sm font-medium">Denied</p>
            </div>
          </div>
        </Card>
        <Card className="border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card className="bg-white p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">All Leave Requests</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Pilot
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Type
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Start Date
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  End Date
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
              </tr>
            </thead>
            <tbody className="divide-border divide-y bg-white">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {req.pilot_name}
                  </td>
                  <td className="text-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {req.request_type}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {format(new Date(req.start_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {format(new Date(req.end_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {req.days_count}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {req.roster_period}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        req.status === 'PENDING'
                          ? 'bg-primary/10 text-primary'
                          : req.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {requests.length} leave requests
        </div>
      </Card>
    </div>
  )
}
