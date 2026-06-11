/**
 * Requests Table Component
 *
 * Data table for displaying pilot requests with sorting, bulk actions, and inline status updates.
 * Built on the URL-synced data table system (useDataTable + components/ui/data-table):
 * sort/page/perPage live in the query string; pagination replaces the old 200-row render cap.
 * Filtering stays external (the page's filter bar owns the filter URL params).
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'
'use no memo'

import React, { useMemo, useState } from 'react'
import type { ColumnDef, Row } from '@tanstack/react-table'
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
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils/date-utils'
import { useDataTable } from '@/lib/hooks/use-data-table'

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
  // Optional enrichment field populated by the service layer (computed,
  // not in the DB). Was previously accessed via `(request as any)`.
  roster_periods_spanned?: string[]
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

// ============================================================================
// Helper Functions
// ============================================================================

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
  const icons: Record<PilotRequest['submission_channel'], React.ReactNode> = {
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

const pilotDisplayName = (request: PilotRequest) =>
  request.name ||
  (request.pilot ? `${request.pilot.first_name} ${request.pilot.last_name}` : 'Unknown')

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)

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

  // ============================================================================
  // Columns
  // ============================================================================

  const columns = useMemo<ColumnDef<PilotRequest>[]>(() => {
    const cols: ColumnDef<PilotRequest>[] = [
      {
        id: 'expander',
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setExpandedRequest((current) =>
                current === row.original.id ? null : row.original.id
              )
            }
            className="h-8 w-8 p-0"
            aria-expanded={expandedRequest === row.original.id}
            aria-label={`${expandedRequest === row.original.id ? 'Collapse' : 'Expand'} details for ${pilotDisplayName(row.original)}`}
          >
            {expandedRequest === row.original.id ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        ),
      },
    ]

    if (enableSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllRowsSelected(checked as boolean)}
            aria-label="Select all requests"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked as boolean)}
            aria-label={`Select request from ${pilotDisplayName(row.original)}`}
          />
        ),
      })
    }

    cols.push(
      {
        id: 'name',
        accessorFn: (row) => pilotDisplayName(row).toLowerCase(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pilot" />,
        meta: { label: 'Pilot' },
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{pilotDisplayName(row.original)}</p>
            <p className="text-muted-foreground text-xs">
              {row.original.rank || row.original.pilot?.role || 'Unknown'} • #
              {row.original.employee_number || row.original.pilot?.employee_id || ''}
            </p>
          </div>
        ),
      },
      {
        id: 'category',
        accessorKey: 'request_category',
        header: 'Category',
        enableSorting: false,
        meta: { label: 'Category' },
        cell: ({ row }) => getCategoryBadge(row.original.request_category),
      },
      {
        id: 'type',
        accessorKey: 'request_type',
        header: 'Type',
        enableSorting: false,
        meta: { label: 'Type' },
        cell: ({ row }) => <span className="text-sm">{row.original.request_type}</span>,
      },
      {
        id: 'roster_period',
        accessorKey: 'roster_period',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Roster Period(s)" />,
        meta: { label: 'Roster Period(s)' },
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.roster_periods_spanned
              ? row.original.roster_periods_spanned.join(', ')
              : row.original.roster_period}
          </span>
        ),
      },
      {
        id: 'start_date',
        accessorKey: 'start_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dates" />,
        meta: { label: 'Dates' },
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm">{formatDate(row.original.start_date)}</p>
            {row.original.end_date && (
              <p className="text-muted-foreground text-xs">
                to {formatDate(row.original.end_date)}
              </p>
            )}
            {row.original.days_count && (
              <p className="text-muted-foreground text-xs">
                {row.original.days_count} day{row.original.days_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'channel',
        accessorKey: 'submission_channel',
        header: 'Channel',
        enableSorting: false,
        meta: { label: 'Channel' },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getChannelIcon(row.original.submission_channel)}
            <span className="text-xs">{row.original.submission_channel}</span>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'workflow_status',
        header: 'Status',
        enableSorting: false,
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusBadge status={row.original.workflow_status} size="sm" hideIcon />,
      },
      {
        id: 'flags',
        header: 'Flags',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.is_late_request && (
              <Badge
                variant="outline"
                className="border-[var(--color-status-medium)] text-[var(--color-status-medium)]"
              >
                <Clock className="mr-1 h-3 w-3" />
                Late
              </Badge>
            )}
            {row.original.is_past_deadline && (
              <Badge
                variant="outline"
                className="border-[var(--color-status-high)] text-[var(--color-status-high)]"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                Past
              </Badge>
            )}
            {row.original.conflict_flags && row.original.conflict_flags.length > 0 && (
              <Badge
                variant="outline"
                className="border-[var(--color-status-high)] bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                {row.original.conflict_flags.length} Conflict
                {row.original.conflict_flags.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ),
      },
      // Hidden column backing the default "newest first" sort
      {
        id: 'submission_date',
        accessorKey: 'submission_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
        meta: { label: 'Submitted' },
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.submission_date)}</span>
        ),
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const request = row.original
          return (
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
          )
        },
      }
    )

    return cols
  }, [enableSelection, expandedRequest, onViewRequest, onUpdateStatus, onDeleteRequest])

  const { table } = useDataTable({
    data: requests,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: enableSelection,
    initialState: {
      sorting: [{ id: 'submission_date', desc: true }],
      pagination: { pageIndex: 0, pageSize: 25 },
      columnVisibility: { submission_date: false },
    },
  })

  // ============================================================================
  // Bulk Action Handlers
  // ============================================================================

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id)

  const handleBulkAction = async (action: 'approve' | 'deny' | 'delete') => {
    if (onBulkAction && selectedIds.length > 0) {
      await onBulkAction(selectedIds, action)
      table.resetRowSelection()
    }
  }

  // ============================================================================
  // Expanded Details Sub-Row
  // ============================================================================

  const renderSubRow = (row: Row<PilotRequest>) => {
    if (row.original.id !== expandedRequest) return null
    const request = row.original

    return (
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
                <span className="text-muted-foreground font-medium">Submitted:</span>{' '}
                <span className="text-foreground">{formatDate(request.submission_date)}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Channel:</span>{' '}
                <span className="text-foreground">{request.submission_channel}</span>
              </div>
            </div>
          </div>

          {/* Date Information Card */}
          <div className="border-border bg-card rounded-lg border-2 p-4">
            <h5 className="text-muted-foreground mb-3 text-sm font-semibold">Date Information</h5>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Start Date:</span>{' '}
                <span className="text-foreground">{formatDate(request.start_date)}</span>
              </div>
              {request.end_date && (
                <div>
                  <span className="text-muted-foreground font-medium">End Date:</span>{' '}
                  <span className="text-foreground">{formatDate(request.end_date)}</span>
                </div>
              )}
              {request.days_count && (
                <div>
                  <span className="text-muted-foreground font-medium">Duration:</span>{' '}
                  <span className="text-foreground">{request.days_count} days</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground font-medium">Roster Period(s):</span>{' '}
                <div className="mt-1 flex flex-wrap gap-1">
                  {request.roster_periods_spanned ? (
                    request.roster_periods_spanned.map((period: string) => (
                      <Badge key={period} variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
                        {period}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
                      {request.roster_period}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Flags Card */}
          <div className="border-border bg-card rounded-lg border-2 p-4">
            <h5 className="text-muted-foreground mb-3 text-sm font-semibold">Status & Flags</h5>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Status:</span>{' '}
                <StatusBadge status={request.workflow_status} />
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Priority Score:</span>{' '}
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
            <h5 className="text-muted-foreground mb-2 text-sm font-semibold">Reason</h5>
            <p className="text-foreground text-sm">{request.reason}</p>
          </div>
        )}
      </div>
    )
  }

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
      {enableSelection && selectedIds.length > 0 && (
        <div className="mb-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedIds.length} request{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleBulkAction('approve')}>
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve All
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkAction('deny')}>
                <XCircle className="mr-1 h-4 w-4" />
                Deny All
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete All
              </Button>
              <Button size="sm" variant="ghost" onClick={() => table.resetRowSelection()}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable table={table} renderSubRow={renderSubRow} className={className} />

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
