/**
 * Leave Request Details Page
 * Displays comprehensive leave request information with audit trail
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getLeaveRequestById } from '@/lib/services/leave-service'
import { getLeaveRequestApprovalHistory } from '@/lib/services/audit-service'
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

  // Fetch leave request details
  const leaveRequest = await getLeaveRequestById(id)

  if (!leaveRequest) {
    notFound()
  }

  // Status badge configuration
  const statusConfig = {
    PENDING: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    APPROVED: { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-300' },
    DENIED: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-300' },
    CANCELLED: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-300' },
  }

  const config = statusConfig[leaveRequest.status as keyof typeof statusConfig] || statusConfig.PENDING

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-foreground text-xl sm:text-2xl font-bold">
            Leave Request Details
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Request ID: {id.slice(0, 8)}...
          </p>
        </div>
        <Badge className={`border ${config.className}`}>
          {leaveRequest.status}
        </Badge>
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
function LeaveRequestDetailsCard({ leaveRequest }: { leaveRequest: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request Information</CardTitle>
        <CardDescription>Leave request details and pilot information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pilot Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <User className="h-4 w-4" />
            Pilot Information
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Pilot Name</div>
              <div className="font-medium">
                {leaveRequest.pilots?.first_name} {leaveRequest.pilots?.last_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rank</div>
              <div className="font-medium">{leaveRequest.pilots?.role || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Leave Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Calendar className="h-4 w-4" />
            Leave Details
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {leaveRequest.start_date ? format(new Date(leaveRequest.start_date), 'MMM d, yyyy') : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">End Date</div>
              <div className="font-medium">
                {leaveRequest.end_date ? format(new Date(leaveRequest.end_date), 'MMM d, yyyy') : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Days Count</div>
              <div className="font-medium">{leaveRequest.days_count} days</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Roster Period</div>
              <div className="font-medium">{leaveRequest.roster_period || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Timestamps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Clock className="h-4 w-4" />
            Timestamps
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Submitted</div>
              <div className="font-medium text-sm">
                {format(new Date(leaveRequest.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div className="font-medium text-sm">
                {format(new Date(leaveRequest.updated_at || leaveRequest.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Information (if approved/denied) */}
        {(leaveRequest.status === 'APPROVED' || leaveRequest.status === 'DENIED') && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Decision Information
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {leaveRequest.approved_by && (
                  <div>
                    <div className="text-xs text-muted-foreground">Reviewed By</div>
                    <div className="font-medium">{leaveRequest.approved_by}</div>
                  </div>
                )}
                {leaveRequest.approval_date && (
                  <div>
                    <div className="text-xs text-muted-foreground">Decision Date</div>
                    <div className="font-medium text-sm">
                      {format(new Date(leaveRequest.approval_date), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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
          <p className="text-sm text-muted-foreground">
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
