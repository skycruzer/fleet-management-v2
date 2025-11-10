'use client'

/**
 * Leave Bids Client Component
 *
 * Client-side component for displaying and managing pilot leave bids.
 * Allows viewing bid details, status, and cancelling pending bids.
 *
 * @developer Maurice Rondeau
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Calendar, FileText, AlertCircle, CheckCircle2, Clock, XCircle, Download } from 'lucide-react'
import type { LeaveBid } from '@/lib/services/leave-bid-service'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface LeaveBidsClientProps {
  initialBids: LeaveBid[]
}

export function LeaveBidsClient({ initialBids }: LeaveBidsClientProps) {
  const { csrfToken } = useCsrfToken()
  const router = useRouter()
  const [bids, setBids] = useState<LeaveBid[]>(initialBids)
  const [selectedBid, setSelectedBid] = useState<LeaveBid | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string>('')

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      PENDING: { variant: 'secondary', icon: <Clock className="mr-1 h-3 w-3" /> },
      PROCESSING: { variant: 'default', icon: <Clock className="mr-1 h-3 w-3" /> },
      APPROVED: { variant: 'default', icon: <CheckCircle2 className="mr-1 h-3 w-3" /> },
      REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
    }

    const config = statusMap[status || 'PENDING'] || statusMap.PENDING

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {status || 'PENDING'}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      HIGH: 'destructive',
      MEDIUM: 'default',
      LOW: 'secondary',
    }

    return <Badge variant={priorityMap[priority] || 'secondary'}>{priority}</Badge>
  }

  const handleCancelBid = async () => {
    if (!selectedBid) return

    setIsCancelling(true)
    setError('')

    try {
      const response = await fetch('/api/portal/leave-bids', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ bidId: selectedBid.id }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to cancel leave bid')
        setIsCancelling(false)
        return
      }

      // Remove cancelled bid from list
      setBids(bids.filter((bid) => bid.id !== selectedBid.id))
      setShowCancelDialog(false)
      setSelectedBid(null)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleExportPDF = async (bid: LeaveBid) => {
    try {
      const response = await fetch(`/api/portal/leave-bids/export?bidId=${bid.id}`)

      if (!response.ok) {
        setError('Failed to generate PDF')
        return
      }

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leave-bid-${bid.roster_period_code}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Failed to download PDF')
    }
  }

  const parseDates = (datesJson: string): string[] => {
    try {
      return JSON.parse(datesJson)
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bids.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bids.filter((b) => b.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bids.filter((b) => b.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bids.filter((b) => b.status === 'REJECTED').length}
            </div>
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

      {/* Leave Bids Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Bid History</CardTitle>
          <CardDescription>
            All your submitted leave bids with their current approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No Leave Bids</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                You haven't submitted any leave bids yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roster Period</TableHead>
                  <TableHead>Preferred Dates</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">{bid.roster_period_code}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {parseDates(bid.preferred_dates).slice(0, 2).join(', ')}
                        {parseDates(bid.preferred_dates).length > 2 &&
                          ` +${parseDates(bid.preferred_dates).length - 2} more`}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(bid.priority)}</TableCell>
                    <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    <TableCell>
                      {bid.submitted_at
                        ? new Date(bid.submitted_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(bid)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          PDF
                        </Button>
                        {bid.status === 'PENDING' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBid(bid)
                              setShowCancelDialog(true)
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Bid</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave bid for{' '}
              <strong>{selectedBid?.roster_period_code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Bid
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBid}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
