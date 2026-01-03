'use client'

/**
 * Compact Request Card Component
 * Space-efficient card for displaying pilot requests
 * Expandable for full details
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import * as React from 'react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  ChevronDown,
  Clock,
  MoreHorizontal,
  Plane,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface RequestCardData {
  id: string
  pilotName: string
  pilotRank: 'Captain' | 'First Officer'
  requestCategory: 'LEAVE' | 'FLIGHT' | 'LEAVE_BID'
  requestType?: string // e.g., "ANNUAL", "SICK", "TRAINING"
  startDate: Date | string
  endDate: Date | string
  rosterPeriod?: string
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
  notes?: string
  createdAt: Date | string
}

interface RequestCardCompactProps {
  request: RequestCardData
  onApprove?: (id: string) => void
  onDeny?: (id: string) => void
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  className?: string
}

const statusConfig = {
  SUBMITTED: {
    label: 'Pending',
    variant: 'warning' as const,
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'In Review',
    variant: 'outline' as const,
    icon: AlertCircle,
  },
  APPROVED: {
    label: 'Approved',
    variant: 'success' as const,
    icon: CheckCircle2,
  },
  DENIED: {
    label: 'Denied',
    variant: 'destructive' as const,
    icon: XCircle,
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    variant: 'secondary' as const,
    icon: XCircle,
  },
}

const categoryIcons = {
  LEAVE: Calendar,
  FLIGHT: Plane,
  LEAVE_BID: Calendar,
}

export function RequestCardCompact({
  request,
  onApprove,
  onDeny,
  onView,
  onEdit,
  className,
}: RequestCardCompactProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const startDate = new Date(request.startDate)
  const endDate = new Date(request.endDate)
  const days = differenceInDays(endDate, startDate) + 1
  const statusInfo = statusConfig[request.status]
  const StatusIcon = statusInfo.icon
  const CategoryIcon = categoryIcons[request.requestCategory]
  const isPending = request.status === 'SUBMITTED' || request.status === 'IN_REVIEW'

  return (
    <div
      className={cn(
        'bg-card rounded-xl border transition-all duration-200',
        isPending && 'border-l-4 border-l-amber-400',
        request.status === 'APPROVED' && 'border-l-4 border-l-emerald-400',
        request.status === 'DENIED' && 'border-l-4 border-l-red-400',
        className
      )}
    >
      {/* Main Row - Always Visible */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center gap-2.5">
          {/* Category Icon */}
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <CategoryIcon className="h-5 w-5" />
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium">{request.pilotName}</span>
              <Badge variant="outline" className="h-5 text-xs">
                {request.pilotRank === 'Captain' ? 'CAPT' : 'F/O'}
              </Badge>
              {request.requestType && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {request.requestType}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
              <span>
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
              </span>
              <span className="font-medium">{days}d</span>
              {request.rosterPeriod && <span>{request.rosterPeriod}</span>}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant} className="hidden h-6 gap-1 sm:flex">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>

            {/* Mobile status indicator */}
            <div className="sm:hidden">
              <StatusIcon
                className={cn(
                  'h-5 w-5',
                  statusInfo.variant === 'success' && 'text-emerald-500',
                  statusInfo.variant === 'warning' && 'text-amber-500',
                  statusInfo.variant === 'destructive' && 'text-red-500',
                  statusInfo.variant === 'outline' && 'text-blue-500'
                )}
              />
            </div>

            {/* Quick actions for pending requests */}
            {isPending && (onApprove || onDeny) && (
              <div className="hidden items-center gap-1 sm:flex">
                {onApprove && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => onApprove(request.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                {onDeny && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onDeny(request.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(request.id)}>
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && isPending && (
                  <DropdownMenuItem onClick={() => onEdit(request.id)}>Edit</DropdownMenuItem>
                )}
                {isPending && onApprove && (
                  <DropdownMenuItem
                    onClick={() => onApprove(request.id)}
                    className="text-emerald-600"
                  >
                    Approve
                  </DropdownMenuItem>
                )}
                {isPending && onDeny && (
                  <DropdownMenuItem onClick={() => onDeny(request.id)} className="text-red-600">
                    Deny
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Expand toggle */}
            {request.notes && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {request.notes && (
        <div
          className={cn(
            'grid transition-all duration-200',
            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t px-4 pt-0 pb-4">
              <p className="text-muted-foreground mt-3 text-sm">{request.notes}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                Submitted {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile action buttons for pending */}
      {isPending && (onApprove || onDeny) && (
        <div className="flex border-t sm:hidden">
          {onApprove && (
            <Button
              variant="ghost"
              className="flex-1 rounded-none text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => onApprove(request.id)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {onDeny && (
            <Button
              variant="ghost"
              className="flex-1 rounded-none border-l text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDeny(request.id)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deny
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * List of compact request cards
 */
export function RequestCardList({
  requests,
  onApprove,
  onDeny,
  onView,
  onEdit,
  emptyMessage = 'No requests found',
  className,
}: {
  requests: RequestCardData[]
  onApprove?: (id: string) => void
  onDeny?: (id: string) => void
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  emptyMessage?: string
  className?: string
}) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
        <Calendar className="text-muted-foreground/50 mb-2.5 h-8 w-8" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {requests.map((request) => (
        <RequestCardCompact
          key={request.id}
          request={request}
          onApprove={onApprove}
          onDeny={onDeny}
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

export { type RequestCardCompactProps }
