'use client'

/**
 * Leave Requests List Page
 *
 * Displays all leave requests for the authenticated pilot with status,
 * allows filtering and cancellation of pending requests.
 *
 * @spec 001-missing-core-features (US2)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Calendar, CheckCircle, XCircle, Clock, Trash2, CalendarCheck, Pencil } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { LeaveBidForm } from '@/components/portal/leave-bid-form'
import { LeaveRequestForm } from '@/components/portal/leave-request-form'
import { LeaveRequestEditForm } from '@/components/portal/leave-request-edit-form'

interface LeaveRequest {
  id: string
  request_type: string
  start_date: string
  end_date: string
  workflow_status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'
  reason?: string | null
  request_date?: string | null
  is_late_request?: boolean | null
  days_count: number
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comments?: string | null
  created_at: string | null
}

interface LeaveBid {
  id: string
  bid_year: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string | null
  leave_bid_options: Array<{
    id: string
    priority: number
    start_date: string
    end_date: string
  }>
}

export default function LeaveRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [leaveBids, setLeaveBids] = useState<LeaveBid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DENIED' | 'WITHDRAWN'>('ALL')
  const [isLeaveBidDialogOpen, setIsLeaveBidDialogOpen] = useState(false)
  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isEditBidDialogOpen, setIsEditBidDialogOpen] = useState(false)
  const [selectedBid, setSelectedBid] = useState<LeaveBid | null>(null)

  useEffect(() => {
    fetchLeaveRequests()
    fetchLeaveBids()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/portal/leave-requests')
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to fetch leave requests')
        setIsLoading(false)
        return
      }

      setRequests(result.data || [])
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const fetchLeaveBids = async () => {
    try {
      const response = await fetch('/api/portal/leave-bids')
      const result = await response.json()

      if (!response.ok || !result.success) {
        // Don't set error for leave bids, just log it
        console.error('Failed to fetch leave bids:', result.error)
        return
      }

      setLeaveBids(result.data || [])
    } catch (err) {
      console.error('Failed to fetch leave bids:', err)
    }
  }

  const cancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    try {
      const response = await fetch(`/api/portal/leave-requests?id=${requestId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to cancel request')
        return
      }

      // Refresh list
      await fetchLeaveRequests()

      // Refresh router cache
      router.refresh()
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      alert('An unexpected error occurred')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        )
      case 'IN_REVIEW':
        return (
          <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            In Review
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'DENIED':
        return (
          <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Denied
          </Badge>
        )
      case 'WITHDRAWN':
        return (
          <Badge variant="outline" className="border-gray-300 bg-gray-100 text-gray-800">
            <XCircle className="mr-1 h-3 w-3" />
            Withdrawn
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RDO: 'bg-blue-500',
      SDO: 'bg-indigo-500',
      ANNUAL: 'bg-green-500',
      SICK: 'bg-red-500',
      LSL: 'bg-primary/50',
      LWOP: 'bg-gray-500',
      MATERNITY: 'bg-pink-500',
      COMPASSIONATE: 'bg-orange-500',
    }
    return colors[type] || 'bg-gray-400'
  }

  const filteredRequests = filter === 'ALL' ? requests : requests.filter((r) => r.workflow_status === filter)

  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.workflow_status === 'SUBMITTED').length,
    in_review: requests.filter((r) => r.workflow_status === 'IN_REVIEW').length,
    approved: requests.filter((r) => r.workflow_status === 'APPROVED').length,
    denied: requests.filter((r) => r.workflow_status === 'DENIED').length,
    withdrawn: requests.filter((r) => r.workflow_status === 'WITHDRAWN').length,
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading leave requests...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="mt-1 text-gray-600">
            {stats.total} total request{stats.total !== 1 ? 's' : ''} | {stats.submitted + stats.in_review} pending review
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* New Leave Request Modal */}
          <Dialog open={isLeaveRequestDialogOpen} onOpenChange={setIsLeaveRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>Request time off from your roster</DialogDescription>
              </DialogHeader>
              <LeaveRequestForm
                csrfToken=""
                onSuccess={() => {
                  setIsLeaveRequestDialogOpen(false)
                  router.refresh()  // Refresh cache
                  fetchLeaveRequests() // Refresh the list
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Leave Bid Modal */}
          <Dialog open={isLeaveBidDialogOpen} onOpenChange={setIsLeaveBidDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                Submit Leave Bid
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
              <DialogHeader>
                <DialogTitle>Annual Leave Bid</DialogTitle>
                <DialogDescription>
                  Submit your preferred leave dates for the year ahead
                </DialogDescription>
              </DialogHeader>
              <LeaveBidForm
                onSuccess={() => {
                  setIsLeaveBidDialogOpen(false)
                  router.refresh()  // Refresh cache
                  fetchLeaveBids() // Refresh the leave bids list
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'SUBMITTED' ? 'default' : 'outline'}
          onClick={() => setFilter('SUBMITTED')}
          size="sm"
        >
          Submitted ({stats.submitted})
        </Button>
        <Button
          variant={filter === 'IN_REVIEW' ? 'default' : 'outline'}
          onClick={() => setFilter('IN_REVIEW')}
          size="sm"
        >
          In Review ({stats.in_review})
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          onClick={() => setFilter('APPROVED')}
          size="sm"
        >
          Approved ({stats.approved})
        </Button>
        <Button
          variant={filter === 'DENIED' ? 'default' : 'outline'}
          onClick={() => setFilter('DENIED')}
          size="sm"
        >
          Denied ({stats.denied})
        </Button>
        <Button
          variant={filter === 'WITHDRAWN' ? 'default' : 'outline'}
          onClick={() => setFilter('WITHDRAWN')}
          size="sm"
        >
          Withdrawn ({stats.withdrawn})
        </Button>
      </div>

      {/* Leave Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">
              {filter === 'ALL'
                ? 'No leave requests yet'
                : `No ${filter.toLowerCase()} leave requests`}
            </p>
            {filter === 'ALL' && (
              <Button className="mt-4" onClick={() => setIsLeaveRequestDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Your First Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <Badge className={getLeaveTypeColor(request.request_type)}>
                        {request.request_type}
                      </Badge>
                      {getStatusBadge(request.workflow_status)}
                      {request.is_late_request && (
                        <Badge
                          variant="outline"
                          className="border-yellow-300 bg-yellow-50 text-yellow-700"
                        >
                          Late Request
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">
                      {format(new Date(request.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(request.end_date), 'MMM dd, yyyy')}
                    </CardTitle>
                    <CardDescription>
                      {request.days_count} day{request.days_count !== 1 ? 's' : ''} • Submitted{' '}
                      {request.created_at
                        ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true })
                        : 'recently'}
                    </CardDescription>
                  </div>

                  {(request.workflow_status === 'SUBMITTED' || request.workflow_status === 'IN_REVIEW') && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsEditDialogOpen(true)
                        }}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelRequest(request.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {request.reason && (
                  <div className="mb-4">
                    <p className="mb-1 text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-sm text-gray-600">{request.reason}</p>
                  </div>
                )}

                {request.review_comments && (
                  <div className="mt-4 rounded-md bg-gray-50 p-3">
                    <p className="mb-1 text-sm font-medium text-gray-700">Review Comments:</p>
                    <p className="text-sm text-gray-600">{request.review_comments}</p>
                  </div>
                )}

                {(request.workflow_status === 'APPROVED' || request.workflow_status === 'DENIED') && request.reviewed_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    Reviewed{' '}
                    {formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leave Bids History Section */}
      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Leave Bids History</h2>
        <p className="mb-6 text-gray-600">
          All your annual leave bid submissions across all years
        </p>

        {leaveBids.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No leave bids submitted yet</p>
              <Button
                className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600"
                onClick={() => setIsLeaveBidDialogOpen(true)}
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                Submit Your First Leave Bid
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaveBids.map((bid) => {
              const getBidStatusBadge = (status: string) => {
                switch (status) {
                  case 'PENDING':
                    return (
                      <Badge
                        variant="outline"
                        className="border-yellow-300 bg-yellow-100 text-yellow-800"
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Pending Review
                      </Badge>
                    )
                  case 'APPROVED':
                    return (
                      <Badge
                        variant="outline"
                        className="border-green-300 bg-green-100 text-green-800"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    )
                  case 'REJECTED':
                    return (
                      <Badge
                        variant="outline"
                        className="border-red-300 bg-red-100 text-red-800"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                      </Badge>
                    )
                  default:
                    return <Badge variant="outline">{status}</Badge>
                }
              }

              return (
                <Card key={bid.id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <Badge className="bg-cyan-500">Year {bid.bid_year}</Badge>
                          {getBidStatusBadge(bid.status)}
                        </div>
                        <CardTitle className="text-xl">
                          Annual Leave Bid for {bid.bid_year}
                        </CardTitle>
                        <CardDescription>
                          {bid.leave_bid_options?.length || 0} preference
                          {(bid.leave_bid_options?.length || 0) !== 1 ? 's' : ''} • Submitted{' '}
                          {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>

                      {bid.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBid(bid)
                            setIsEditBidDialogOpen(true)
                          }}
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Leave Preferences:</p>
                      {(bid.leave_bid_options || [])
                        .sort((a, b) => a.priority - b.priority)
                        .map((option) => (
                          <div
                            key={option.id}
                            className="flex items-start justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex-1">
                              <p className="mb-1 text-sm font-semibold text-gray-900">
                                Priority {option.priority}
                              </p>
                              <p className="text-sm text-gray-700">
                                {format(new Date(option.start_date), 'MMM dd, yyyy')} -{' '}
                                {format(new Date(option.end_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>

                    {bid.updated_at && bid.status !== 'PENDING' && (
                      <p className="mt-4 text-xs text-gray-500">
                        Reviewed {formatDistanceToNow(new Date(bid.updated_at), { addSuffix: true })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Leave Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
            <DialogDescription>
              Update your leave request details
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <LeaveRequestEditForm
              request={selectedRequest}
              onSuccess={async () => {
                setIsEditDialogOpen(false)
                setSelectedRequest(null)
                await fetchLeaveRequests()
                router.refresh()
                await new Promise(resolve => setTimeout(resolve, 100))
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedRequest(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Leave Bid Dialog */}
      <Dialog open={isEditBidDialogOpen} onOpenChange={setIsEditBidDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Leave Bid</DialogTitle>
            <DialogDescription>
              Update your annual leave bid preferences
            </DialogDescription>
          </DialogHeader>
          {selectedBid && (
            <LeaveBidForm
              initialData={{
                id: selectedBid.id,
                bid_year: selectedBid.bid_year,
                options: selectedBid.leave_bid_options.map((opt) => ({
                  priority: opt.priority,
                  start_date: opt.start_date,
                  end_date: opt.end_date,
                })),
              }}
              isEdit={true}
              onSuccess={() => {
                setIsEditBidDialogOpen(false)
                setSelectedBid(null)
                router.refresh()
                fetchLeaveBids()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
