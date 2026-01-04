/**
 * Request Cards Grid Component
 * Author: Maurice Rondeau
 * Date: December 20, 2025
 * Updated: December 20, 2025 - Added Edit/Delete functionality
 *
 * Grid layout for displaying request approval cards.
 * Used in the unified dashboard's "cards" view mode.
 * Features: Sorting, bulk selection, bulk approve/deny actions, edit/delete.
 */

'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LeaveApprovalCard } from '@/components/leave/leave-approval-card'
import { RequestEditDialog } from '@/components/requests/request-edit-dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { CheckCircle, AlertTriangle, Loader2, ArrowUpDown, CheckCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { PilotRequest } from '@/lib/services/unified-request-service'
import { isCriticalRequest, hasWarningFlags } from '@/lib/utils/request-stats-utils'

type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'seniority-asc'
  | 'seniority-desc'

interface RequestCardsGridProps {
  requests: PilotRequest[]
  onApprove: (id: string) => Promise<void>
  onDeny: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  className?: string
  isLoading?: boolean
}

// Type for request editing - maps PilotRequest to format needed by RequestEditDialog
interface EditableRequest {
  id: string
  request_category: string
  request_type: string
  start_date: string
  end_date: string | null
  flight_date: string | null
  reason: string | null
  notes: string | null
  source_reference: string | null
  name: string
  employee_number: string
}

export function RequestCardsGrid({
  requests,
  onApprove,
  onDeny,
  onDelete,
  className,
  isLoading = false,
}: RequestCardsGridProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Edit/Delete state
  const [editingRequest, setEditingRequest] = useState<EditableRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<PilotRequest | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate stats for header
  const criticalCount = requests.filter(isCriticalRequest).length
  const warningCount = requests.filter((r) => hasWarningFlags(r) && !isCriticalRequest(r)).length

  // Sort requests based on selected option
  const sortedRequests = [...requests].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'date-asc':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '')
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '')
      case 'seniority-asc':
        return (a.pilot?.seniority_number || 999) - (b.pilot?.seniority_number || 999)
      case 'seniority-desc':
        return (b.pilot?.seniority_number || 999) - (a.pilot?.seniority_number || 999)
      default:
        return 0
    }
  })

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(requests.map((r) => r.id)))
  }, [requests])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk action handlers
  const handleBulkApprove = useCallback(async () => {
    const ids = Array.from(selectedIds)
    let successCount = 0
    let errorCount = 0

    startTransition(async () => {
      for (const id of ids) {
        try {
          await onApprove(id)
          successCount++
        } catch {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Approved ${successCount} request${successCount > 1 ? 's' : ''}`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to approve ${errorCount} request${errorCount > 1 ? 's' : ''}`)
      }

      clearSelection()
    })
  }, [selectedIds, onApprove, clearSelection])

  const handleBulkDeny = useCallback(async () => {
    const ids = Array.from(selectedIds)
    let successCount = 0
    let errorCount = 0

    startTransition(async () => {
      for (const id of ids) {
        try {
          await onDeny(id)
          successCount++
        } catch {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Denied ${successCount} request${successCount > 1 ? 's' : ''}`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to deny ${errorCount} request${errorCount > 1 ? 's' : ''}`)
      }

      clearSelection()
    })
  }, [selectedIds, onDeny, clearSelection])

  // Edit handler - convert PilotRequest to EditableRequest format
  const handleEdit = useCallback(
    (request: {
      id: string
      pilot_id: string
      employee_number: string
      rank: string
      name: string
      request_type: string
      request_category?: 'LEAVE' | 'FLIGHT'
      start_date: string
      end_date: string | null
      reason: string | null
      notes: string | null
    }) => {
      // Find the full request from our requests array to get all fields
      const fullRequest = requests.find((r) => r.id === request.id)
      if (fullRequest) {
        setEditingRequest({
          id: fullRequest.id,
          request_category: fullRequest.request_category || 'LEAVE',
          request_type: fullRequest.request_type || '',
          start_date: fullRequest.start_date || '',
          end_date: fullRequest.end_date || null,
          flight_date: fullRequest.flight_date || null,
          reason: fullRequest.reason || null,
          notes: fullRequest.notes || null,
          source_reference: fullRequest.source_reference || null,
          name: fullRequest.name || 'Unknown',
          employee_number: fullRequest.employee_number || '',
        })
      }
    },
    [requests]
  )

  // Delete handler - show confirmation dialog
  const handleDeleteClick = useCallback(
    (requestId: string) => {
      const request = requests.find((r) => r.id === requestId)
      if (request) {
        setDeletingRequest(request)
      }
    },
    [requests]
  )

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRequest || !onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(deletingRequest.id)
      toast.success('Request deleted', {
        description: `Deleted ${deletingRequest.request_type} for ${deletingRequest.name}`,
      })
      setDeletingRequest(null)
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deletingRequest, onDelete, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              All Caught Up!
            </h3>
            <p className="text-muted-foreground mt-1.5">
              No pending requests require your attention at this time.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with counts, sorting, and selection controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Requests ({requests.length})</h2>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="border-red-600 text-red-600">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                {warningCount} Warnings
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="text-muted-foreground h-4 w-4" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="seniority-asc">Seniority (Highest)</SelectItem>
                <SelectItem value="seniority-desc">Seniority (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select All / Clear */}
          <div className="flex items-center gap-2">
            {selectedIds.size === 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={requests.length === 0}
              >
                Select All
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (appears when items selected) */}
      {selectedIds.size > 0 && (
        <Card className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30 sticky top-0 z-10 p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === requests.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAll()
                  } else {
                    clearSelection()
                  }
                }}
              />
              <span className="font-medium">
                {selectedIds.size} of {requests.length} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkApprove}
                disabled={isPending}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                {isPending ? 'Processing...' : `Approve All (${selectedIds.size})`}
              </Button>
              <Button onClick={handleBulkDeny} disabled={isPending} variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Processing...' : `Deny All (${selectedIds.size})`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedRequests.map((request) => (
          <LeaveApprovalCard
            key={request.id}
            request={{
              id: request.id,
              pilot_id: request.pilot_id || '',
              employee_number: request.employee_number || '',
              rank: request.rank || 'First Officer',
              name: request.name || 'Unknown',
              request_type: request.request_type || 'LEAVE',
              request_category: (request.request_category as 'LEAVE' | 'FLIGHT') || 'LEAVE',
              start_date: request.start_date || '',
              end_date: request.end_date,
              reason: request.reason,
              notes: request.notes,
              is_late_request: request.is_late_request || false,
              is_past_deadline: request.is_past_deadline || false,
              created_at: request.created_at || new Date().toISOString(),
              roster_period_code: request.roster_period || null,
              conflict_flags: Array.isArray(request.conflict_flags)
                ? (request.conflict_flags as string[])
                : undefined,
              availability_impact:
                typeof request.availability_impact === 'object' &&
                request.availability_impact !== null
                  ? (request.availability_impact as {
                      captains_before?: number
                      captains_after?: number
                      fos_before?: number
                      fos_after?: number
                    })
                  : undefined,
              // New fields for data parity with table view
              days_count: request.days_count,
              submission_channel: request.submission_channel,
              roster_periods_spanned: Array.isArray((request as any).roster_periods_spanned)
                ? (request as any).roster_periods_spanned
                : null,
              // Persistent approval checklist
              approval_checklist: request.approval_checklist || null,
            }}
            onApprove={onApprove}
            onDeny={onDeny}
            onEdit={handleEdit}
            onDelete={onDelete ? handleDeleteClick : undefined}
            isSelected={selectedIds.has(request.id)}
            onSelect={() => toggleSelection(request.id)}
            showCheckbox={true}
          />
        ))}
      </div>

      {/* Help Text */}
      <Card className="border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="mb-1.5 font-semibold text-blue-900 dark:text-blue-300">
              Approval Guidelines
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
              <li>
                <strong>Critical Alerts</strong>: Conflicts or approving would drop crew below
                minimum (10 per rank)
              </li>
              <li>
                <strong>Warnings</strong>: Late submissions or past roster deadline
              </li>
              <li>
                <strong>Seniority Priority</strong>: Higher seniority pilots have approval priority
              </li>
              <li>
                <strong>Crew Minimum</strong>: Must maintain at least 10 Captains and 10 First
                Officers available
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      {editingRequest && (
        <RequestEditDialog
          open={!!editingRequest}
          onOpenChange={(open) => {
            if (!open) setEditingRequest(null)
          }}
          request={editingRequest}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingRequest}
        onOpenChange={(open) => !open && setDeletingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingRequest?.request_type} request for{' '}
              <strong>{deletingRequest?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
