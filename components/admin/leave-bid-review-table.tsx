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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle, XCircle, Clock, Eye, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
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
}

interface LeaveBidReviewTableProps {
  bids: LeaveBid[]
}

export function LeaveBidReviewTable({ bids }: LeaveBidReviewTableProps) {
  const { csrfToken } = useCsrfToken()
  const router = useRouter()
  const [expandedBid, setExpandedBid] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const filteredBids = filter === 'ALL' ? bids : bids.filter((b) => b.status === filter)

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
    if (!confirm('Are you sure you want to approve this leave bid?')) {
      return
    }

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
    if (!confirm('Are you sure you want to reject this leave bid?')) {
      return
    }

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

  const toggleExpand = (bidId: string) => {
    setExpandedBid(expandedBid === bidId ? null : bidId)
  }

  return (
    <div className="space-y-4">
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Bid Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBids.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No {filter.toLowerCase()} leave bids found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Bid Year</TableHead>
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
                      <TableCell className="font-semibold">{bid.roster_period_code}</TableCell>
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

                    {/* Expanded Details Row */}
                    {expandedBid === bid.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50">
                          <div className="space-y-3 py-4">
                            <h4 className="text-foreground font-semibold">Bid Options</h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                              {bid.leave_bid_options
                                .sort((a, b) => a.priority - b.priority)
                                .map((option) => (
                                  <div
                                    key={option.id}
                                    className="bg-card border-border rounded-lg border-2 p-3"
                                  >
                                    <div className="mb-2 flex items-center gap-2">
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
                                    <p className="text-foreground text-sm font-semibold">
                                      {format(new Date(option.start_date), 'MMM dd')} -{' '}
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
                                  </div>
                                ))}
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
