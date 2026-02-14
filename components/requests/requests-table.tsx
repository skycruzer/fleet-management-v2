/**
 * Requests Table Component
 *
 * Data table for displaying pilot requests with sorting, bulk actions, and inline status updates.
 * Supports selection, filtering, and comprehensive request management.
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowUpDown,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Mail,
  Phone,
  Globe,
  User,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date-utils'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PilotRequest {
  id: string
  pilot_id: string
  employee_number: string
  rank: 'Captain' | 'First Officer'
  name: string
  request_category: 'LEAVE' | 'FLIGHT' | 'LEAVE_BID'
  request_type: string
  submission_channel: 'PILOT_PORTAL' | 'EMAIL' | 'PHONE' | 'ORACLE' | 'ADMIN_PORTAL'
  submission_date: string
  start_date: string
  end_date: string | null
  days_count: number | null
  roster_period: string
  workflow_status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
  is_late_request: boolean
  is_past_deadline: boolean
  priority_score: number
  reason: string | null
  conflict_flags?: string[]
  availability_impact?: {
    captains_before?: number
    captains_after?: number
    fos_before?: number
    fos_after?: number
  } | null
  pilot?: {
    first_name: string
    last_name: string
    seniority_number: number
    role?: 'Captain' | 'First Officer'
    employee_id?: string
  }
}

export interface RequestsTableProps {
  /**
   * List of pilot requests to display
   */
  requests: PilotRequest[]

  /**
   * Loading state
   */
  loading?: boolean

  /**
   * Callback when request is selected for viewing
   */
  onViewRequest?: (request: PilotRequest) => void

  /**
   * Callback when request status is updated
   */
  onUpdateStatus?: (
    requestId: string,
    status: PilotRequest['workflow_status'],
    comments?: string,
    force?: boolean
  ) => Promise<void>

  /**
   * Callback when request is deleted
   */
  onDeleteRequest?: (requestId: string) => Promise<void>

  /**
   * Callback for bulk actions
   */
  onBulkAction?: (requestIds: string[], action: 'approve' | 'deny' | 'delete') => Promise<void>

  /**
   * Enable selection for bulk actions
   */
  enableSelection?: boolean

  /**
   * Custom className
   */
  className?: string
}

type SortColumn = 'name' | 'submission_date' | 'start_date' | 'roster_period' | 'priority_score'
type SortDirection = 'asc' | 'desc'

// ============================================================================
// Component
// ============================================================================

export function RequestsTable({
  requests,
  loading = false,
  onViewRequest,
  onUpdateStatus,
  onDeleteRequest,
  onBulkAction,
  enableSelection = true,
  className = '',
}: RequestsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<SortColumn>('submission_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests.map((r) => r.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(requestId)
    } else {
      newSelected.delete(requestId)
    }
    setSelectedIds(newSelected)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // ============================================================================
  // Sorting Handlers
  // ============================================================================

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedRequests = [...requests].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortColumn) {
      case 'name':
        // Use fallback to pilot data for older records without denormalized fields
        aValue = (
          a.name || (a.pilot ? `${a.pilot.first_name} ${a.pilot.last_name}` : 'Unknown')
        ).toLowerCase()
        bValue = (
          b.name || (b.pilot ? `${b.pilot.first_name} ${b.pilot.last_name}` : 'Unknown')
        ).toLowerCase()
        break
      case 'submission_date':
        aValue = new Date(a.submission_date).getTime()
        bValue = new Date(b.submission_date).getTime()
        break
      case 'start_date':
        aValue = new Date(a.start_date).getTime()
        bValue = new Date(b.start_date).getTime()
        break
      case 'roster_period':
        aValue = a.roster_period
        bValue = b.roster_period
        break
      case 'priority_score':
        aValue = a.priority_score
        bValue = b.priority_score
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleDeleteClick = (requestId: string) => {
    setRequestToDelete(requestId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (requestToDelete && onDeleteRequest) {
      await onDeleteRequest(requestToDelete)
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    }
  }

  const handleBulkApprove = async () => {
    if (onBulkAction && selectedIds.size > 0) {
      await onBulkAction(Array.from(selectedIds), 'approve')
      clearSelection()
    }
  }

  const handleBulkDeny = async () => {
    if (onBulkAction && selectedIds.size > 0) {
      await onBulkAction(Array.from(selectedIds), 'deny')
      clearSelection()
    }
  }

  const handleBulkDelete = async () => {
    if (onBulkAction && selectedIds.size > 0) {
      await onBulkAction(Array.from(selectedIds), 'delete')
      clearSelection()
    }
  }

  const toggleExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId)
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusBadge = (status: PilotRequest['workflow_status']) => {
    const variants: Record<PilotRequest['workflow_status'], { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      SUBMITTED: { variant: 'default', label: 'Submitted' },
      IN_REVIEW: { variant: 'secondary', label: 'In Review' },
      APPROVED: { variant: 'default', label: 'Approved' },
      DENIED: { variant: 'destructive', label: 'Denied' },
      WITHDRAWN: { variant: 'outline', label: 'Withdrawn' },
    }

    const { variant, label } = variants[status]
    return (
      <Badge variant={variant} className="font-medium">
        {label}
      </Badge>
    )
  }

  const getCategoryBadge = (category: PilotRequest['request_category']) => {
    const colors: Record<PilotRequest['request_category'], string> = {
      LEAVE: 'bg-[var(--color-category-flight-bg)] text-[var(--color-category-flight)]',
      FLIGHT: 'bg-[var(--color-category-simulator-bg)] text-[var(--color-category-simulator)]',
      LEAVE_BID: 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]',
    }

    const labels: Record<PilotRequest['request_category'], string> = {
      LEAVE: 'Leave',
      FLIGHT: 'Flight',
      LEAVE_BID: 'Bid',
    }

    return (
      <Badge variant="outline" className={colors[category]}>
        {labels[category]}
      </Badge>
    )
  }

  const getChannelIcon = (channel: PilotRequest['submission_channel']) => {
    const labels: Record<PilotRequest['submission_channel'], string> = {
      PILOT_PORTAL: 'Pilot Portal',
      EMAIL: 'Email',
      PHONE: 'Phone',
      ORACLE: 'Oracle',
      ADMIN_PORTAL: 'Admin Portal',
    }
    const icons: Record<PilotRequest['submission_channel'], any> = {
      PILOT_PORTAL: <User className="h-4 w-4" aria-hidden="true" />,
      EMAIL: <Mail className="h-4 w-4" aria-hidden="true" />,
      PHONE: <Phone className="h-4 w-4" aria-hidden="true" />,
      ORACLE: <Globe className="h-4 w-4" aria-hidden="true" />,
      ADMIN_PORTAL: <User className="h-4 w-4" aria-hidden="true" />,
    }

    return (
      <>
        {icons[channel]}
        <span className="sr-only">{labels[channel]}</span>
      </>
    )
  }

  // Uses shared formatDate from @/lib/utils/date-utils

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return <TableSkeleton rows={8} columns={7} />
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No requests found"
        description="Try adjusting your filters or create a new request."
      />
    )
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {enableSelection && selectedIds.size > 0 && (
        <div className="bg-primary/10 border-primary/20 mb-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkApprove}>
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve All
              </Button>
              <Button size="sm" variant="secondary" onClick={handleBulkDeny}>
                <XCircle className="mr-1 h-4 w-4" />
                Deny All
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete All
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`overflow-hidden rounded-lg border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              {enableSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === requests.length && requests.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all requests"
                  />
                </TableHead>
              )}
              <TableHead
                aria-sort={
                  sortColumn === 'name'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="-ml-3"
                >
                  Pilot
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                aria-sort={
                  sortColumn === 'roster_period'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('roster_period')}
                  className="-ml-3"
                >
                  Roster Period(s)
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead
                aria-sort={
                  sortColumn === 'start_date'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('start_date')}
                  className="-ml-3"
                >
                  Dates
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map((request) => (
              <React.Fragment key={request.id}>
                {/* Main Row */}
                <TableRow
                  className={
                    selectedIds.has(request.id)
                      ? 'bg-muted/50 hover:bg-muted/60'
                      : 'hover:bg-muted/30'
                  }
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(request.id)}
                      className="h-8 w-8 p-0"
                      aria-expanded={expandedRequest === request.id}
                      aria-label={`${expandedRequest === request.id ? 'Collapse' : 'Expand'} details for ${request.name || 'request'}`}
                    >
                      {expandedRequest === request.id ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TableCell>
                  {enableSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRequest(request.id, checked as boolean)
                        }
                        aria-label={`Select request from ${request.name || 'unknown pilot'}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {request.name ||
                          (request.pilot
                            ? `${request.pilot.first_name} ${request.pilot.last_name}`
                            : 'Unknown')}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {request.rank || request.pilot?.role || 'Unknown'} • #
                        {request.employee_number || request.pilot?.employee_id || ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(request.request_category)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{request.request_type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {(request as any).roster_periods_spanned
                        ? (request as any).roster_periods_spanned.join(', ')
                        : request.roster_period}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{formatDate(request.start_date)}</p>
                      {request.end_date && (
                        <p className="text-muted-foreground text-xs">
                          to {formatDate(request.end_date)}
                        </p>
                      )}
                      {request.days_count && (
                        <p className="text-muted-foreground text-xs">
                          {request.days_count} day{request.days_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getChannelIcon(request.submission_channel)}
                      <span className="text-xs">{request.submission_channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.workflow_status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.is_late_request && (
                        <Badge
                          variant="outline"
                          className="border-[var(--color-status-medium)] text-[var(--color-status-medium)]"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          Late
                        </Badge>
                      )}
                      {request.is_past_deadline && (
                        <Badge
                          variant="outline"
                          className="border-[var(--color-status-high)] text-[var(--color-status-high)]"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Past
                        </Badge>
                      )}
                      {request.conflict_flags && request.conflict_flags.length > 0 && (
                        <Badge
                          variant="outline"
                          className="border-[var(--color-status-high)] bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {request.conflict_flags.length} Conflict
                          {request.conflict_flags.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onViewRequest && (
                          <DropdownMenuItem
                            onClick={() => onViewRequest(request)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onUpdateStatus &&
                          request.workflow_status !== 'APPROVED' &&
                          request.workflow_status !== 'DENIED' && (
                            <>
                              {request.workflow_status === 'SUBMITTED' && (
                                <DropdownMenuItem
                                  onClick={() => onUpdateStatus(request.id, 'IN_REVIEW')}
                                  className="cursor-pointer text-[var(--color-info)] focus:bg-[var(--color-info-bg)] focus:text-[var(--color-info)]"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Mark as In Review
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(request.id, 'APPROVED')}
                                className="cursor-pointer text-[var(--color-status-low)] focus:bg-[var(--color-status-low-bg)] focus:text-[var(--color-status-low)]"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(request.id, 'DENIED')}
                                className="cursor-pointer text-[var(--color-status-medium)] focus:bg-[var(--color-status-medium-bg)] focus:text-[var(--color-status-medium)]"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Deny
                              </DropdownMenuItem>
                            </>
                          )}
                        {onDeleteRequest && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(request.id)}
                              className="cursor-pointer text-[var(--color-status-high)] focus:bg-[var(--color-status-high-bg)] focus:text-[var(--color-status-high)]"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Expanded Details Row */}
                {expandedRequest === request.id && (
                  <TableRow>
                    <TableCell colSpan={enableSelection ? 10 : 9} className="bg-muted/50">
                      <div className="space-y-4 py-4">
                        <h4 className="text-foreground font-semibold">Request Details</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {/* Request Information Card */}
                          <div className="border-border bg-card rounded-lg border-2 p-4">
                            <h5 className="text-muted-foreground mb-3 text-sm font-semibold">
                              Request Information
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground font-medium">Type:</span>{' '}
                                <span className="text-foreground">{request.request_type}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Category:</span>{' '}
                                {getCategoryBadge(request.request_category)}
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">
                                  Submitted:
                                </span>{' '}
                                <span className="text-foreground">
                                  {formatDate(request.submission_date)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Channel:</span>{' '}
                                <span className="text-foreground">
                                  {request.submission_channel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Date Information Card */}
                          <div className="border-border bg-card rounded-lg border-2 p-4">
                            <h5 className="text-muted-foreground mb-3 text-sm font-semibold">
                              Date Information
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground font-medium">
                                  Start Date:
                                </span>{' '}
                                <span className="text-foreground">
                                  {formatDate(request.start_date)}
                                </span>
                              </div>
                              {request.end_date && (
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    End Date:
                                  </span>{' '}
                                  <span className="text-foreground">
                                    {formatDate(request.end_date)}
                                  </span>
                                </div>
                              )}
                              {request.days_count && (
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    Duration:
                                  </span>{' '}
                                  <span className="text-foreground">{request.days_count} days</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground font-medium">
                                  Roster Period(s):
                                </span>{' '}
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {(request as any).roster_periods_spanned ? (
                                    (request as any).roster_periods_spanned.map(
                                      (period: string) => (
                                        <Badge
                                          key={period}
                                          variant="outline"
                                          className="h-4 px-1.5 py-0 text-[10px]"
                                        >
                                          {period}
                                        </Badge>
                                      )
                                    )
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="h-4 px-1.5 py-0 text-[10px]"
                                    >
                                      {request.roster_period}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status & Flags Card */}
                          <div className="border-border bg-card rounded-lg border-2 p-4">
                            <h5 className="text-muted-foreground mb-3 text-sm font-semibold">
                              Status & Flags
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground font-medium">Status:</span>{' '}
                                {getStatusBadge(request.workflow_status)}
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">
                                  Priority Score:
                                </span>{' '}
                                <span className="text-foreground">{request.priority_score}</span>
                              </div>
                              {request.is_late_request && (
                                <div>
                                  <Badge
                                    variant="outline"
                                    className="border-[var(--color-status-medium)] text-[var(--color-status-medium)]"
                                  >
                                    <Clock className="mr-1 h-3 w-3" />
                                    Late Request
                                  </Badge>
                                </div>
                              )}
                              {request.is_past_deadline && (
                                <div>
                                  <Badge
                                    variant="outline"
                                    className="border-[var(--color-status-high)] text-[var(--color-status-high)]"
                                  >
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Past Deadline
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reason (if provided) */}
                        {request.reason && (
                          <div className="border-border bg-card rounded-lg border-2 p-4">
                            <h5 className="text-muted-foreground mb-2 text-sm font-semibold">
                              Reason
                            </h5>
                            <p className="text-foreground text-sm">{request.reason}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
