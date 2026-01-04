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
          <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
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
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
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
            <p className="py-8 text-center text-gray-500">
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
                    <TableRow className="hover:bg-gray-50">
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
                        <span className="text-xs text-gray-500">
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
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(bid.id)}
                                disabled={actionLoading === bid.id}
                                className="border-red-300 text-red-700 hover:bg-red-50"
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
                        <TableCell colSpan={8} className="bg-gray-50">
                          <div className="space-y-3 py-4">
                            <h4 className="font-semibold text-gray-900">Bid Options</h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                              {bid.leave_bid_options
                                .sort((a, b) => a.priority - b.priority)
                                .map((option) => (
                                  <div
                                    key={option.id}
                                    className="rounded-lg border-2 border-gray-200 bg-white p-3"
                                  >
                                    <div className="mb-2 flex items-center gap-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-900">
                                        {option.priority}
                                      </span>
                                      <span className="text-xs font-medium text-gray-600">
                                        {option.priority === 1 && '1st Choice'}
                                        {option.priority === 2 && '2nd Choice'}
                                        {option.priority === 3 && '3rd Choice'}
                                        {option.priority === 4 && '4th Choice'}
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {format(new Date(option.start_date), 'MMM dd')} -{' '}
                                      {format(new Date(option.end_date), 'MMM dd, yyyy')}
                                    </p>
                                    <p className="text-xs text-gray-500">
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
