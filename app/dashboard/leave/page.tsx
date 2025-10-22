/**
 * Leave Requests Page
 * Manage pilot leave requests and approvals
 */

export const dynamic = 'force-dynamic'

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'

export const metadata = dashboardMetadata.leave
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { getAllLeaveRequests } from '@/lib/services/leave-service'
import { LeaveRequestGroup } from '@/components/leave/leave-request-group'
import { FileText, CheckCircle, BarChart3, XCircle, Calendar, Plus } from 'lucide-react'

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

  // Group leave requests by type -> role -> sort by start date
  const groupedRequests = requests.reduce(
    (acc, req) => {
      const type = req.request_type || 'Other'
      const role = (req.pilots?.role as 'Captain' | 'First Officer') || 'Unknown'

      if (!acc[type]) {
        acc[type] = { Captain: [], 'First Officer': [], Unknown: [] }
      }
      if (!acc[type][role]) {
        acc[type][role] = []
      }
      acc[type][role].push(req)
      return acc
    },
    {} as Record<string, Record<string, typeof requests>>
  )

  // Sort requests within each role by start date
  Object.keys(groupedRequests).forEach((type) => {
    Object.keys(groupedRequests[type]).forEach((role) => {
      groupedRequests[type][role].sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
    })
  })

  // Sort types alphabetically
  const sortedTypes = Object.keys(groupedRequests).sort()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl sm:text-2xl font-bold">Leave Requests</h2>
          <p className="text-muted-foreground mt-1 text-sm">Submit and manage pilot leave requests</p>
        </div>
        <Link href="/dashboard/leave/new" className="w-full sm:w-auto">
          <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Submit Leave Request
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20 p-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.pending}</p>
              <p className="text-muted-foreground text-sm font-medium">Pending Requests</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.approved}</p>
              <p className="text-muted-foreground text-sm font-medium">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="border-destructive/20 bg-red-50 p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.denied}</p>
              <p className="text-muted-foreground text-sm font-medium">Denied</p>
            </div>
          </div>
        </Card>
        <Card className="border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leave Request Type Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">Request Types</h3>
          <div className="text-muted-foreground text-sm">
            {sortedTypes.length} types • {requests.length} total requests
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Leave requests are grouped by type and role, sorted by start date within each group.
        </p>
      </Card>

      {/* Grouped Leave Requests by Type and Role */}
      <div className="space-y-4">
        {sortedTypes.map((type) => (
          <LeaveRequestGroup
            key={type}
            type={type}
            roleGroups={groupedRequests[type]}
            defaultExpanded
          />
        ))}
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No leave requests found"
          description="Submit your first leave request to get started with the leave management system."
          action={{
            label: 'Submit Leave Request',
            href: '/dashboard/leave/new',
          }}
        />
      )}
    </div>
  )
}
