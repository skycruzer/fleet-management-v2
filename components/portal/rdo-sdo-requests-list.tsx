'use client'

/**
 * RDO/SDO Requests List Component
 *
 * Client-side component for displaying and managing pilot RDO/SDO requests.
 * Allows viewing request details, status, and cancelling requests.
 *
 * @developer Maurice Rondeau
 * @date January 19, 2025
 * @version 3.0.0 - 3-table architecture
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  FileText,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import type { FlightRequest } from '@/lib/services/pilot-flight-service'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { formatRosterPeriodFromObject, parseRosterPeriodCode } from '@/lib/utils/roster-utils'

interface FlightRequestsListProps {
  initialRequests: FlightRequest[]
}

export function FlightRequestsList({ initialRequests }: FlightRequestsListProps) {
  const { csrfToken } = useCsrfToken()
  const router = useRouter()
  const [requests, setRequests] = useState<FlightRequest[]>(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState<FlightRequest | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string>('')

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
    > = {
      SUBMITTED: { variant: 'secondary', icon: <Clock className="mr-1 h-3 w-3" /> },
      IN_REVIEW: { variant: 'default', icon: <FileText className="mr-1 h-3 w-3" /> },
      APPROVED: { variant: 'default', icon: <CheckCircle2 className="mr-1 h-3 w-3" /> },
      DENIED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
      WITHDRAWN: { variant: 'outline', icon: <Ban className="mr-1 h-3 w-3" /> },
    }

    const config = statusMap[status] || statusMap.SUBMITTED

    return (
      <Badge variant={config.variant} className="flex w-fit items-center">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const getRequestTypeBadge = (type: string) => {
    const typeMap: Record<string, 'default' | 'secondary'> = {
      RDO: 'default',
      SDO: 'secondary',
    }

    return <Badge variant={typeMap[type] || 'secondary'}>{type}</Badge>
  }

  const canCancelRequest = (request: FlightRequest): boolean => {
    // Can cancel SUBMITTED, IN_REVIEW, or APPROVED requests
    return ['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(request.workflow_status)
  }

  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    setIsCancelling(true)
    setError('')

    try {
      const response = await fetch(`/api/portal/rdo-sdo-requests?id=${selectedRequest.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to cancel request')
        setIsCancelling(false)
        return
      }

      // Update request status to WITHDRAWN
      setRequests(
        requests.map((req) =>
          req.id === selectedRequest.id ? { ...req, workflow_status: 'WITHDRAWN' } : req
        )
      )
      setShowCancelDialog(false)
      setSelectedRequest(null)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateDaysCount = (request: FlightRequest): number => {
    const start = new Date(request.start_date)
    const end = request.end_date ? new Date(request.end_date) : start
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  // Calculate stats
  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.workflow_status === 'SUBMITTED').length,
    in_review: requests.filter((r) => r.workflow_status === 'IN_REVIEW').length,
    approved: requests.filter((r) => r.workflow_status === 'APPROVED').length,
    denied: requests.filter((r) => r.workflow_status === 'DENIED').length,
    withdrawn: requests.filter((r) => r.workflow_status === 'WITHDRAWN').length,
    rdo: requests.filter((r) => r.request_type === 'RDO').length,
    sdo: requests.filter((r) => r.request_type === 'SDO').length,
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.rdo} RDO, {stats.sdo} SDO
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-status-medium)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted + stats.in_review}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.submitted} submitted, {stats.in_review} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--color-status-low)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied/Withdrawn</CardTitle>
            <XCircle className="h-4 w-4 text-[var(--color-status-high)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.denied + stats.withdrawn}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.denied} denied, {stats.withdrawn} withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your RDO/SDO Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No RDO/SDO requests found</p>
              <p className="mt-2 text-sm">Submit your first request to get started.</p>
              <Link href="/portal/flight-requests/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit RDO/SDO Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Roster Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{getRequestTypeBadge(request.request_type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatDate(request.start_date)}</div>
                          {request.end_date && request.end_date !== request.start_date && (
                            <div className="text-muted-foreground text-sm">
                              to {formatDate(request.end_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{calculateDaysCount(request)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{request.roster_period}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.workflow_status)}</TableCell>
                      <TableCell>
                        <div className="text-muted-foreground text-sm">
                          {formatDate(request.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancelRequest(request) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowCancelDialog(true)
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {selectedRequest?.request_type} Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this request? This action will set the request status
              to WITHDRAWN and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{selectedRequest.request_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dates:</span>
                <span className="font-medium">
                  {formatDate(selectedRequest.start_date)}
                  {selectedRequest.end_date &&
                    selectedRequest.end_date !== selectedRequest.start_date &&
                    ` - ${formatDate(selectedRequest.end_date)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span>{getStatusBadge(selectedRequest.workflow_status)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Request
            </Button>
            <Button variant="destructive" onClick={handleCancelRequest} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
