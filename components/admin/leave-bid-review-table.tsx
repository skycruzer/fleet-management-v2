'use client'

/**
 * Leave Bid Review Table Component
 * Displays all leave bids with review and approval functionality
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
  roster_periods?: string[]
}

interface Pilot {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  employee_id: string | null
  role: string | null
  seniority_number: number | null
}

interface LeaveBid {
  id: string
  roster_period_code: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | null
  created_at: string | null
  updated_at: string | null
  pilot_id: string
  pilots: Pilot
  leave_bid_options: LeaveBidOption[]
  option_statuses?: Record<string, string>
}

interface LeaveBidReviewTableProps {
  bids: LeaveBid[]
}

export function LeaveBidReviewTable({ bids }: LeaveBidReviewTableProps) {
  const { csrfToken } = useCsrfToken()
  const router = useRouter()
  const { confirm, ConfirmDialog } = useConfirm()
  const [expandedBid, setExpandedBid] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [selectedBids, setSelectedBids] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const filteredBids = filter === 'ALL' ? bids : bids.filter((b) => b.status === filter)

  // Only pending bids can be selected for bulk actions
  const selectableBids = filteredBids.filter((b) => b.status === 'PENDING')
  const allSelectableSelected =
    selectableBids.length > 0 && selectableBids.every((b) => selectedBids.has(b.id))

  const toggleSelectBid = (bidId: string) => {
    setSelectedBids((prev) => {
      const next = new Set(prev)
      if (next.has(bidId)) {
        next.delete(bidId)
      } else {
        next.add(bidId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedBids(new Set())
    } else {
      setSelectedBids(new Set(selectableBids.map((b) => b.id)))
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApprove = async (bidId: string) => {
    const confirmed = await confirm({
      title: 'Approve Leave Bid',
      description: 'Are you sure you want to approve this leave bid? The pilot will be notified.',
      confirmText: 'Approve',
      variant: 'default',
    })
    if (!confirmed) return

    setActionLoading(bidId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/leave-bids/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ bidId, action: 'approve' }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to approve bid')
        return
      }

      setSuccess('Leave bid approved successfully! Pilot will be notified.')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (bidId: string) => {
    const confirmed = await confirm({
      title: 'Reject Leave Bid',
      description: 'Are you sure you want to reject this leave bid? The pilot will be notified.',
      confirmText: 'Reject',
      variant: 'destructive',
    })
    if (!confirmed) return

    setActionLoading(bidId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/leave-bids/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ bidId, action: 'reject' }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to reject bid')
        return
      }

      setSuccess('Leave bid rejected. Pilot will be notified.')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const ids = Array.from(selectedBids)
    if (ids.length === 0) return

    const actionLabel = action === 'approve' ? 'approve' : 'reject'
    const confirmed = await confirm({
      title: `Bulk ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} Leave Bids`,
      description: `Are you sure you want to ${actionLabel} ${ids.length} leave bid${ids.length > 1 ? 's' : ''}? All affected pilots will be notified.`,
      confirmText: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} All (${ids.length})`,
      variant: action === 'approve' ? 'default' : 'destructive',
    })
    if (!confirmed) return

    setBulkLoading(true)
    setError('')
    setSuccess('')

    let successCount = 0
    let failCount = 0

    for (const bidId of ids) {
      try {
        const response = await fetch('/api/admin/leave-bids/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'x-csrf-token': csrfToken }),
          },
          body: JSON.stringify({ bidId, action }),
          credentials: 'include',
        })
        const result = await response.json()
        if (response.ok && result.success) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    setBulkLoading(false)
    setSelectedBids(new Set())

    if (failCount === 0) {
      setSuccess(
        `Successfully ${actionLabel}d ${successCount} leave bid${successCount > 1 ? 's' : ''}. Pilots have been notified.`
      )
    } else {
      setError(
        `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}d ${successCount} bid${successCount > 1 ? 's' : ''}, but ${failCount} failed.`
      )
    }
    router.refresh()
  }

  const handleOptionReview = async (
    bidId: string,
    optionKey: string,
    action: 'approve' | 'reject'
  ) => {
    setActionLoading(`${bidId}-${optionKey}`)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/leave-bids/review-option', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ bidId, optionKey, action }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || `Failed to ${action} preference`)
        return
      }

      const ordinal =
        Number(optionKey) === 0
          ? '1st'
          : Number(optionKey) === 1
            ? '2nd'
            : Number(optionKey) === 2
              ? '3rd'
              : `${Number(optionKey) + 1}th`
      setSuccess(`${ordinal} preference ${action}d successfully. Pilot notified.`)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const getOptionStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[10px] text-[var(--color-status-low)]"
          >
            <CheckCircle className="mr-0.5 h-2.5 w-2.5" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-[10px] text-[var(--color-status-high)]"
          >
            <XCircle className="mr-0.5 h-2.5 w-2.5" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-[10px] text-[var(--color-status-medium)]"
          >
            <Clock className="mr-0.5 h-2.5 w-2.5" />
            Pending
          </Badge>
        )
    }
  }

  const toggleExpand = (bidId: string) => {
    setExpandedBid(expandedBid === bidId ? null : bidId)
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
          <CheckCircle className="h-4 w-4 text-[var(--color-status-low)]" />
          <AlertDescription className="text-[var(--color-status-low)]">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
          size="sm"
        >
          Pending ({bids.filter((b) => b.status === 'PENDING').length})
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          onClick={() => setFilter('APPROVED')}
          size="sm"
        >
          Approved ({bids.filter((b) => b.status === 'APPROVED').length})
        </Button>
        <Button
          variant={filter === 'REJECTED' ? 'default' : 'outline'}
          onClick={() => setFilter('REJECTED')}
          size="sm"
        >
          Rejected ({bids.filter((b) => b.status === 'REJECTED').length})
        </Button>
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          All ({bids.length})
        </Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedBids.size > 0 && (
        <div className="bg-muted/80 flex items-center justify-between rounded-lg border px-4 py-3">
          <span className="text-sm font-medium">
            {selectedBids.size} bid{selectedBids.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkAction('approve')}
              disabled={bulkLoading}
              className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[var(--color-status-low)] hover:bg-[var(--color-status-low)]/20"
            >
              {bulkLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="mr-1 h-3 w-3" />
              )}
              Approve All ({selectedBids.size})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('reject')}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              Reject All ({selectedBids.size})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedBids(new Set())}
              disabled={bulkLoading}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Bid Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBids.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={`No ${filter.toLowerCase()} leave bids found`}
              description="Try changing the filter to see other leave bids."
              variant="compact"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {selectableBids.length > 0 && (
                      <Checkbox
                        checked={allSelectableSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all pending bids"
                      />
                    )}
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Preferences, Date Ranges & Roster Periods</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBids.map((bid) => (
                  <React.Fragment key={bid.id}>
                    {/* Main Row */}
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        {bid.status === 'PENDING' && (
                          <Checkbox
                            checked={selectedBids.has(bid.id)}
                            onCheckedChange={() => toggleSelectBid(bid.id)}
                            aria-label={`Select bid from ${bid.pilots.first_name} ${bid.pilots.last_name}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(bid.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedBid === bid.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {bid.pilots.first_name} {bid.pilots.last_name}
                        <br />
                        <span className="text-muted-foreground text-xs">
                          ID: {bid.pilots.employee_id || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{bid.pilots.role || 'N/A'}</TableCell>
                      <TableCell>#{bid.pilots.seniority_number || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {bid.leave_bid_options
                            .sort((a, b) => a.priority - b.priority)
                            .map((opt, idx) => {
                              const start = opt.start_date
                                ? format(new Date(opt.start_date), 'dd MMM yyyy')
                                : '?'
                              const end = opt.end_date
                                ? format(new Date(opt.end_date), 'dd MMM yyyy')
                                : '?'
                              const days =
                                opt.start_date && opt.end_date
                                  ? Math.ceil(
                                      (new Date(opt.end_date).getTime() -
                                        new Date(opt.start_date).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) + 1
                                  : 0
                              const ordinal =
                                opt.priority === 1
                                  ? '1st'
                                  : opt.priority === 2
                                    ? '2nd'
                                    : opt.priority === 3
                                      ? '3rd'
                                      : `${opt.priority}th`
                              const optionStatus = bid.option_statuses?.[String(idx)]
                              return (
                                <div
                                  key={opt.id || idx}
                                  className="flex flex-wrap items-center gap-1.5"
                                >
                                  <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {ordinal}
                                  </Badge>
                                  <span className="text-xs">
                                    {start} – {end}
                                    <span className="text-muted-foreground ml-1">({days}d)</span>
                                  </span>
                                  {opt.roster_periods && opt.roster_periods.length > 0 && (
                                    <>
                                      <span className="text-muted-foreground text-[10px]">→</span>
                                      {opt.roster_periods.map((rp) => (
                                        <Badge
                                          key={rp}
                                          variant="outline"
                                          className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-1.5 py-0 text-[10px] text-[var(--color-info)]"
                                        >
                                          {rp}
                                        </Badge>
                                      ))}
                                    </>
                                  )}
                                  {getOptionStatusBadge(optionStatus)}
                                </div>
                              )
                            })}
                          {bid.leave_bid_options.length === 0 && (
                            <span className="text-muted-foreground text-xs">No preferences</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bid.created_at ? format(new Date(bid.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(bid.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* View Button - Always Available */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/admin/leave-bids/${bid.id}`)}
                            className="border-[var(--color-info-border)] text-[var(--color-info)] hover:bg-[var(--color-info-bg)]"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>

                          {/* Edit Button - Always Available */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/admin/leave-bids/${bid.id}/edit`)
                            }
                            className="border-border text-muted-foreground hover:bg-muted"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>

                          {/* Approve/Reject - Only for Pending */}
                          {bid.status === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(bid.id)}
                                disabled={actionLoading === bid.id}
                                className="border-[var(--color-status-low-border)] text-[var(--color-status-low)] hover:bg-[var(--color-status-low-bg)]"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(bid.id)}
                                disabled={actionLoading === bid.id}
                                className="border-[var(--color-status-high-border)] text-[var(--color-status-high)] hover:bg-[var(--color-status-high-bg)]"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row — Per-Option Review */}
                    {expandedBid === bid.id && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/50">
                          <div className="space-y-3 py-4">
                            <h4 className="text-foreground font-semibold">
                              Review Individual Preferences
                            </h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                              {bid.leave_bid_options
                                .sort((a, b) => a.priority - b.priority)
                                .map((option, idx) => {
                                  const optKey = String(idx)
                                  const optStatus = bid.option_statuses?.[optKey]
                                  const isLoading = actionLoading === `${bid.id}-${optKey}`
                                  return (
                                    <div
                                      key={option.id}
                                      className={`bg-card rounded-lg border-2 p-3 ${
                                        optStatus === 'APPROVED'
                                          ? 'border-[var(--color-status-low-border)]'
                                          : optStatus === 'REJECTED'
                                            ? 'border-[var(--color-status-high-border)]'
                                            : 'border-border'
                                      }`}
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                                            {option.priority}
                                          </span>
                                          <span className="text-muted-foreground text-xs font-medium">
                                            {option.priority === 1 && '1st Choice'}
                                            {option.priority === 2 && '2nd Choice'}
                                            {option.priority === 3 && '3rd Choice'}
                                            {option.priority === 4 && '4th Choice'}
                                          </span>
                                        </div>
                                        {getOptionStatusBadge(optStatus)}
                                      </div>
                                      <p className="text-foreground text-sm font-semibold">
                                        {format(new Date(option.start_date), 'MMM dd')} –{' '}
                                        {format(new Date(option.end_date), 'MMM dd, yyyy')}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        {Math.ceil(
                                          (new Date(option.end_date).getTime() -
                                            new Date(option.start_date).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        ) + 1}{' '}
                                        days
                                      </p>
                                      {option.roster_periods &&
                                        option.roster_periods.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {option.roster_periods.map((rp) => (
                                              <Badge
                                                key={rp}
                                                variant="outline"
                                                className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-1.5 py-0 text-[10px] text-[var(--color-info)]"
                                              >
                                                {rp}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      {/* Per-option approve/reject buttons */}
                                      <div className="mt-3 flex gap-1.5">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleOptionReview(bid.id, optKey, 'approve')
                                          }
                                          disabled={isLoading || optStatus === 'APPROVED'}
                                          className="h-7 border-[var(--color-status-low-border)] px-2 text-xs text-[var(--color-status-low)] hover:bg-[var(--color-status-low-bg)]"
                                        >
                                          {isLoading ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                          ) : (
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                          )}
                                          Approve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleOptionReview(bid.id, optKey, 'reject')
                                          }
                                          disabled={isLoading || optStatus === 'REJECTED'}
                                          className="h-7 border-[var(--color-status-high-border)] px-2 text-xs text-[var(--color-status-high)] hover:bg-[var(--color-status-high-bg)]"
                                        >
                                          {isLoading ? (
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                          ) : (
                                            <XCircle className="mr-1 h-3 w-3" />
                                          )}
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
