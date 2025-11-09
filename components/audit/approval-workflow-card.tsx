/**
 * Approval Workflow Card Component
 * Visualizes approval workflow and status transitions for leave requests
 * Shows timeline of all status changes with reasons and performers
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Send,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  getLeaveRequestApprovalHistory,
  type ApprovalTimelineEntry,
} from '@/lib/services/audit-service'

interface ApprovalWorkflowCardProps {
  leaveRequestId: string
}

/**
 * Server Component: Fetches and displays approval workflow history
 */
export async function ApprovalWorkflowCard({
  leaveRequestId,
}: ApprovalWorkflowCardProps) {
  const history = await getLeaveRequestApprovalHistory(leaveRequestId)

  if (!history || history.timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Approval Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No workflow history available
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Approval Workflow</CardTitle>
          <StatusBadge status={history.currentStatus} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Submitted {format(history.submittedAt, 'MMM d, yyyy \'at\' h:mm a')}
        </div>
      </CardHeader>
      <CardContent>
        <ApprovalTimeline timeline={history.timeline} />
      </CardContent>
    </Card>
  )
}

/**
 * Timeline visualization component
 */
function ApprovalTimeline({ timeline }: { timeline: ApprovalTimelineEntry[] }) {
  return (
    <div className="relative space-y-4">
      {/* Vertical timeline line */}
      <div
        className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border"
        aria-hidden="true"
      />

      {timeline.map((entry, index) => (
        <TimelineEntry
          key={index}
          entry={entry}
          isLast={index === timeline.length - 1}
        />
      ))}
    </div>
  )
}

/**
 * Individual timeline entry component
 */
function TimelineEntry({
  entry,
  isLast,
}: {
  entry: ApprovalTimelineEntry
  isLast: boolean
}) {
  const config = getActionConfig(entry.action)

  // Get user initials for avatar
  const initials = entry.performedBy
    ? entry.performedBy.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SY' // System

  return (
    <div className="relative flex gap-3" role="article">
      {/* Icon/Avatar */}
      <div className={cn('relative z-10 flex-shrink-0', isLast ? '' : '')}>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background',
            config.borderColor
          )}
        >
          <config.icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 pb-4">
        {/* Header: Action + Timestamp */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{config.label}</span>
              {entry.newStatus && (
                <Badge variant="outline" className="text-xs">
                  {entry.newStatus}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {format(entry.timestamp, 'MMM d, yyyy \'at\' h:mm a')}
            </div>
          </div>
        </div>

        {/* Performer Information */}
        {entry.performedBy && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="font-medium">{entry.performedBy.name}</span>
              <span className="text-muted-foreground"> • {entry.performedBy.role}</span>
            </div>
          </div>
        )}

        {/* Reason (if provided) */}
        {entry.reason && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Reason
                </div>
                <p className="text-sm">{entry.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Changed Fields (if any) */}
        {entry.changedFields && entry.changedFields.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Modified: {entry.changedFields.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Get configuration for different action types
 */
function getActionConfig(action: ApprovalTimelineEntry['action']) {
  const configs = {
    submitted: {
      icon: Send,
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      label: 'Submitted',
    },
    approved: {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      label: 'Approved',
    },
    denied: {
      icon: XCircle,
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      label: 'Denied',
    },
    cancelled: {
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      label: 'Cancelled',
    },
    updated: {
      icon: Clock,
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      label: 'Updated',
    },
  }

  return configs[action] || configs.updated
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { variant: any; className: string }> = {
    PENDING: {
      variant: 'secondary',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    APPROVED: {
      variant: 'default',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    DENIED: {
      variant: 'destructive',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    CANCELLED: {
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  }

  const config = configs[status] || configs.PENDING

  return (
    <Badge className={cn('border', config.className)}>
      {status}
    </Badge>
  )
}
