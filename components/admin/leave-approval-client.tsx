'use client'

/**
 * Leave Approval Client Component
 *
 * Handles interactive approval/denial of pilot leave requests.
 * Client component is required for state management and API calls.
 * Author: Maurice Rondeau
 *
 * @version 1.0.0
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { approveLeaveRequest, denyLeaveRequest } from '@/app/dashboard/leave/approve/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface LeaveRequest {
  id: string
  pilot_name?: string
  employee_id?: string
  pilot_role?: 'Captain' | 'First Officer' | null
  request_type:
    | 'RDO'
    | 'SDO'
    | 'ANNUAL'
    | 'SICK'
    | 'LSL'
    | 'LWOP'
    | 'MATERNITY'
    | 'COMPASSIONATE'
    | null
  start_date: string
  end_date: string
  days_count: number
  roster_period: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string | null
  created_at: string | null
  is_late_request?: boolean | null
}

interface Props {
  initialRequests: LeaveRequest[]
}

export function LeaveApprovalClient({ initialRequests }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Denial dialog state
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [denyComments, setDenyComments] = useState('')

  // Sync state with props when initialRequests changes
  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  const handleApproval = async (requestId: string) => {
    setIsProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      const result = await approveLeaveRequest(requestId)

      if (!result.success) {
        setError(result.error || 'Failed to approve leave request')
        setIsProcessing(null)
        return
      }

      // Remove the processed request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId))

      setSuccess('Leave request approved successfully')

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error('Approval error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(null)
    }
  }

  const openDenyDialog = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setDenyComments('')
    setDenyDialogOpen(true)
  }

  const closeDenyDialog = () => {
    setDenyDialogOpen(false)
    setSelectedRequest(null)
    setDenyComments('')
  }

  const handleDenial = async () => {
    if (!selectedRequest) return

    if (!denyComments.trim()) {
      setError('Comments are required when denying leave requests')
      return
    }

    setIsProcessing(selectedRequest.id)
    setError(null)
    setSuccess(null)

    try {
      const result = await denyLeaveRequest(selectedRequest.id, denyComments)

      if (!result.success) {
        setError(result.error || 'Failed to deny leave request')
        setIsProcessing(null)
        return
      }

      // Remove the processed request from the list
      setRequests((prev) => prev.filter((req) => req.id !== selectedRequest.id))

      setSuccess('Leave request denied successfully')
      closeDenyDialog()

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      console.error('Denial error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRequestTypeColor = (
    type: LeaveRequest['request_type']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'ANNUAL':
        return 'default'
      case 'SICK':
        return 'destructive'
      case 'RDO':
      case 'SDO':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>No pending leave requests at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-2">
              There are no pending leave requests to review.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>
            Review pilot leave requests and approve or deny based on operational requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{request.pilot_name || 'Unknown Pilot'}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.employee_id || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={request.pilot_role === 'Captain' ? 'default' : 'secondary'}
                      >
                        {request.pilot_role || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRequestTypeColor(request.request_type)}>
                        {request.request_type || 'N/A'}
                      </Badge>
                      {request.is_late_request && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          Late
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{request.roster_period}</TableCell>
                    <TableCell className="text-sm">{formatDate(request.start_date)}</TableCell>
                    <TableCell className="text-sm">{formatDate(request.end_date)}</TableCell>
                    <TableCell className="font-medium">{request.days_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.created_at ? formatDate(request.created_at) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproval(request.id)}
                          disabled={isProcessing === request.id}
                        >
                          {isProcessing === request.id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDenyDialog(request)}
                          disabled={isProcessing === request.id}
                        >
                          Deny
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Denial Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this leave request. This will be shared with the
              pilot.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 bg-muted/50">
                <div className="text-sm font-medium">{selectedRequest.pilot_name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedRequest.request_type} • {formatDate(selectedRequest.start_date)} -{' '}
                  {formatDate(selectedRequest.end_date)} ({selectedRequest.days_count} days)
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deny-comments">Reason for Denial *</Label>
                <Textarea
                  id="deny-comments"
                  placeholder="Enter reason for denying this leave request..."
                  value={denyComments}
                  onChange={(e) => setDenyComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Comments are required when denying leave requests
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDenyDialog} disabled={isProcessing !== null}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDenial}
              disabled={isProcessing !== null || !denyComments.trim()}
            >
              {isProcessing ? 'Processing...' : 'Deny Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
