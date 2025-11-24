/**
 * Leave Requests Page
 * Manage pilot leave requests and approvals
 */

export const dynamic = 'force-dynamic'

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getAllLeaveRequests } from '@/lib/services/leave-service'
import { LeaveRequestsClient } from '@/components/leave/leave-requests-client'
import { FileText, CheckCircle, BarChart3, XCircle, Plus } from 'lucide-react'

export const metadata = dashboardMetadata.leave

export default async function LeaveRequestsPage() {
  // Fetch leave requests data (already filtered to leave category only)
  const requests = await getAllLeaveRequests()

  // Get unique roster periods from requests
  const uniquePeriods = Array.from(
    new Set(requests.map((req) => req.roster_period).filter(Boolean))
  ) as string[]

  // Calculate stats from the data (excluding RDO/SDO)
  const stats = requests.reduce(
    (acc, req) => {
      acc.total++
      if (req.workflow_status === 'SUBMITTED') acc.pending++
      else if (req.workflow_status === 'APPROVED') acc.approved++
      else if (req.workflow_status === 'DENIED') acc.denied++
      acc.totalDays += req.days_count
      return acc
    },
    { total: 0, pending: 0, approved: 0, denied: 0, totalDays: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl font-bold sm:text-2xl">Leave Requests</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Submit and manage pilot leave requests
          </p>
        </div>
        <Link href="/dashboard/leave/new" className="w-full sm:w-auto">
          <Button className="bg-primary hover:bg-primary/90 w-full text-white sm:w-auto">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Submit Leave Request
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20 p-6">
          <div className="flex items-center space-x-3">
            <FileText className="text-primary h-8 w-8" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.pending}</p>
              <p className="text-muted-foreground text-sm font-medium">Pending Requests</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/50">
          <div className="flex items-center space-x-3">
            <CheckCircle
              className="h-8 w-8 text-green-600 dark:text-green-500"
              aria-hidden="true"
            />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.approved}</p>
              <p className="text-muted-foreground text-sm font-medium">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="border-destructive/20 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/50">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.denied}</p>
              <p className="text-muted-foreground text-sm font-medium">Denied</p>
            </div>
          </div>
        </Card>
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="text-primary h-8 w-8" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Component with Filtering and Review */}
      <LeaveRequestsClient requests={requests} availablePeriods={uniquePeriods} />
    </div>
  )
}
