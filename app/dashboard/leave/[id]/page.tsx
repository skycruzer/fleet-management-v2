/**
 * Leave Request Details Page
 * Displays comprehensive leave request information with audit trail
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getPilotRequestById, type PilotRequest } from '@/lib/services/unified-request-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ApprovalWorkflowCard } from '@/components/audit/ApprovalWorkflowCard'
import { ExportAuditButton } from '@/components/audit/ExportAuditButton'
import { format } from 'date-fns'
import { Calendar, User, Clock, FileText, History } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface LeaveRequestPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LeaveRequestPage({ params }: LeaveRequestPageProps) {
  // Next.js 16: params is now a Promise
  const { id } = await params

  // Fetch leave request details using unified request service
  const result = await getPilotRequestById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const leaveRequest = result.data

  // Status badge configuration
  const statusConfig = {
    PENDING: {
      variant: 'secondary' as const,
      className:
        'bg-[var(--color-warning-muted)] text-[var(--color-warning-400)] border-[var(--color-warning-500)]/20',
    },
    APPROVED: {
      variant: 'default' as const,
      className:
        'bg-[var(--color-success-muted)] text-[var(--color-success-400)] border-[var(--color-success-500)]/20',
    },
    DENIED: {
      variant: 'destructive' as const,
      className:
        'bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)] border-[var(--color-danger-500)]/20',
    },
    CANCELLED: {
      variant: 'secondary' as const,
      className: 'bg-muted/60 text-muted-foreground border-border',
    },
  }

  const config =
    statusConfig[leaveRequest.workflow_status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl font-bold sm:text-2xl">Leave Request Details</h2>
          <p className="text-muted-foreground mt-1 text-sm">Request ID: {id.slice(0, 8)}...</p>
        </div>
        <Badge className={`border ${config.className}`}>{leaveRequest.workflow_status}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <LeaveRequestDetailsCard leaveRequest={leaveRequest} />
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Suspense fallback={<AuditTrailSkeleton />}>
            <AuditTrailTab leaveRequestId={id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Leave Request Details Card Component
 */
function LeaveRequestDetailsCard({ leaveRequest }: { leaveRequest: PilotRequest }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request Information</CardTitle>
        <CardDescription>Leave request details and pilot information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pilot Information */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <User className="h-4 w-4" />
            Pilot Information
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs">Pilot Name</div>
              <div className="font-medium">
                {leaveRequest.name ||
                  leaveRequest.pilot?.first_name + ' ' + leaveRequest.pilot?.last_name}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Rank</div>
              <div className="font-medium">{leaveRequest.rank || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Leave Details */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <Calendar className="h-4 w-4" />
            Leave Details
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs">Start Date</div>
              <div className="font-medium">
                {leaveRequest.start_date
                  ? format(new Date(leaveRequest.start_date), 'MMM d, yyyy')
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">End Date</div>
              <div className="font-medium">
                {leaveRequest.end_date
                  ? format(new Date(leaveRequest.end_date), 'MMM d, yyyy')
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Days Count</div>
              <div className="font-medium">{leaveRequest.days_count} days</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Roster Period</div>
              <div className="font-medium">{leaveRequest.roster_period || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Timestamps */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
            <Clock className="h-4 w-4" />
            Timestamps
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs">Submitted</div>
              <div className="text-sm font-medium">
                {leaveRequest.created_at
                  ? format(new Date(leaveRequest.created_at), "MMM d, yyyy 'at' h:mm a")
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Request Type</div>
              <div className="text-sm font-medium">{leaveRequest.request_type || 'N/A'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Audit Trail Tab Component
 */
async function AuditTrailTab({ leaveRequestId }: { leaveRequestId: string }) {
  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <ExportAuditButton
          entityType="leave_request"
          entityId={leaveRequestId}
          label="Export Audit Trail"
        />
      </div>

      {/* Approval Workflow Card */}
      <ApprovalWorkflowCard leaveRequestId={leaveRequestId} />

      {/* Additional Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail Information</CardTitle>
          <CardDescription>
            Complete history of all changes and actions for this leave request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The audit trail above shows all status changes, approvals, denials, and modifications
            made to this leave request, including who made each change and when.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Audit Trail Loading Skeleton
 */
function AuditTrailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
