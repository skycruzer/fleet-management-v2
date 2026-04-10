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
import { CheckCircle2, XCircle, Clock, FileText, Send, AlertCircle } from 'lucide-react'
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
export async function ApprovalWorkflowCard({ leaveRequestId }: ApprovalWorkflowCardProps) {
  const history = await getLeaveRequestApprovalHistory(leaveRequestId)

  if (!history || history.timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Approval Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No workflow history available</p>
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
        <div className="text-muted-foreground mt-1 text-xs">
          Submitted {format(history.submittedAt, "MMM d, yyyy 'at' h:mm a")}
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
      <div className="bg-border absolute top-2 bottom-2 left-[19px] w-[2px]" aria-hidden="true" />

      {timeline.map((entry, index) => (
        <TimelineEntry key={index} entry={entry} isLast={index === timeline.length - 1} />
      ))}
    </div>
  )
}

/**
 * Individual timeline entry component
 */
function TimelineEntry({ entry, isLast }: { entry: ApprovalTimelineEntry; isLast: boolean }) {
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
            'bg-background flex h-10 w-10 items-center justify-center rounded-full border-2',
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
              <span className="text-sm font-semibold">{config.label}</span>
              {entry.newStatus && (
                <Badge variant="outline" className="text-xs">
                  {entry.newStatus}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              {format(entry.timestamp, "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>

        {/* Performer Information */}
        {entry.performedBy && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="font-medium">{entry.performedBy.name}</span>
              <span className="text-muted-foreground"> • {entry.performedBy.role}</span>
            </div>
          </div>
        )}

        {/* Reason (if provided) */}
        {entry.reason && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Reason
                </div>
                <p className="text-sm">{entry.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Changed Fields (if any) */}
        {entry.changedFields && entry.changedFields.length > 0 && (
          <div className="text-muted-foreground text-xs">
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
      iconColor: 'text-[var(--color-info)]',
      borderColor: 'border-[var(--color-info-border)]',
      label: 'Submitted',
    },
    approved: {
      icon: CheckCircle2,
      iconColor: 'text-[var(--color-status-low)]',
      borderColor: 'border-[var(--color-status-low-border)]',
      label: 'Approved',
    },
    denied: {
      icon: XCircle,
      iconColor: 'text-[var(--color-status-high)]',
      borderColor: 'border-[var(--color-status-high-border)]',
      label: 'Denied',
    },
    cancelled: {
      icon: AlertCircle,
      iconColor: 'text-[var(--color-status-medium)]',
      borderColor: 'border-[var(--color-status-medium-border)]',
      label: 'Cancelled',
    },
    updated: {
      icon: Clock,
      iconColor: 'text-[var(--color-status-medium)]',
      borderColor: 'border-[var(--color-status-medium-border)]',
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
      className:
        'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)] border-[var(--color-status-medium-border)]',
    },
    APPROVED: {
      variant: 'default',
      className:
        'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)] border-[var(--color-status-low-border)]',
    },
    DENIED: {
      variant: 'destructive',
      className:
        'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)]',
    },
    CANCELLED: {
      variant: 'secondary',
      className: 'bg-muted text-muted-foreground border-border',
    },
  }

  const config = configs[status] || configs.PENDING

  return <Badge className={cn('border', config.className)}>{status}</Badge>
}
