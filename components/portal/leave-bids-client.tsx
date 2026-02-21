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
import {
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Pencil,
  Plus,
} from 'lucide-react'
import { LeaveBidForm } from '@/components/portal/leave-bid-form'
import type { LeaveBid } from '@/lib/services/leave-bid-service'

interface EnrichedLeaveBid extends LeaveBid {
  enriched_options?: Array<{
    priority: number
    start_date: string
    end_date: string
    roster_periods: string[]
  }>
  all_roster_periods?: string[]
}

interface LeaveBidsClientProps {
  initialBids: EnrichedLeaveBid[]
}

export function LeaveBidsClient({ initialBids }: LeaveBidsClientProps) {
  const router = useRouter()
  const [bids, setBids] = useState<EnrichedLeaveBid[]>(initialBids)
  const [selectedBid, setSelectedBid] = useState<LeaveBid | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNewBidDialog, setShowNewBidDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string>('')

  // Parse preferred_dates from bid to extract options for edit form
  const parsePreferredDates = (
    bid: LeaveBid
  ): Array<{ priority: number; start_date: string; end_date: string }> => {
    try {
      const options = JSON.parse(bid.preferred_dates)
      if (Array.isArray(options)) {
        return options.map((opt, index) => ({
          priority: opt.priority || index + 1,
          start_date: opt.start_date || '',
          end_date: opt.end_date || '',
        }))
      }
      return []
    } catch {
      return []
    }
  }

  // Extract bid year from roster_period_code (e.g., "RP1/2026" -> 2026)
  const getBidYear = (bid: LeaveBid): number => {
    try {
      const match = bid.roster_period_code.match(/\/(\d{4})/)
      if (match) {
        return parseInt(match[1], 10)
      }
      // Try to get year from first option
      const options = parsePreferredDates(bid)
      if (options.length > 0 && options[0].start_date) {
        return new Date(options[0].start_date).getFullYear()
      }
    } catch {
      // ignore
    }
    return new Date().getFullYear() + 1
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    setSelectedBid(null)
    router.refresh()
  }

  const handleNewBidSuccess = () => {
    setShowNewBidDialog(false)
    router.refresh()
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
    > = {
      PENDING: { variant: 'secondary', icon: <Clock className="mr-1 h-3 w-3" /> },
      PROCESSING: { variant: 'default', icon: <Clock className="mr-1 h-3 w-3" /> },
      APPROVED: { variant: 'default', icon: <CheckCircle2 className="mr-1 h-3 w-3" /> },
      REJECTED: { variant: 'destructive', icon: <XCircle className="mr-1 h-3 w-3" /> },
    }

    const config = statusMap[status || 'PENDING'] || statusMap.PENDING

    return (
      <Badge variant={config.variant} className="flex w-fit items-center">
        {config.icon}
        {status || 'PENDING'}
      </Badge>
    )
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
        },
        body: JSON.stringify({ bidId: selectedBid.id }),
        credentials: 'include',
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

      // Refresh router cache
      router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 100))
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
      a.download = `leave-bid-${bid.roster_period_code}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError('Failed to download PDF')
    }
  }

  return (
    <div className="space-y-6">
      {/* Submit New Bid Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowNewBidDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Submit New Leave Bid
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bids.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-status-medium)]" />
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
            <CheckCircle2 className="h-4 w-4 text-[var(--color-status-low)]" />
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
            <XCircle className="h-4 w-4 text-[var(--color-status-high)]" />
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
              <Calendar className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Leave Bids</h3>
              <p className="text-muted-foreground mt-2">
                You haven&apos;t submitted any leave bids yet.
              </p>
              <Button className="mt-4" onClick={() => setShowNewBidDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit New Leave Bid
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roster Period</TableHead>
                  <TableHead>Preferences, Date Ranges & Roster Periods</TableHead>
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
                      <div className="space-y-1.5">
                        {(bid.enriched_options || [])
                          .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                          .map((opt, idx) => {
                            const start = opt.start_date
                              ? new Date(opt.start_date).toLocaleDateString('en-AU', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '?'
                            const end = opt.end_date
                              ? new Date(opt.end_date).toLocaleDateString('en-AU', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
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
                            const optStatus = bid.option_statuses?.[String(idx)]
                            return (
                              <div key={idx} className="flex flex-wrap items-center gap-1.5">
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
                                {optStatus === 'APPROVED' && (
                                  <Badge
                                    variant="outline"
                                    className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-[10px] text-[var(--color-status-low)]"
                                  >
                                    <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                                    Approved
                                  </Badge>
                                )}
                                {optStatus === 'REJECTED' && (
                                  <Badge
                                    variant="outline"
                                    className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-[10px] text-[var(--color-status-high)]"
                                  >
                                    <XCircle className="mr-0.5 h-2.5 w-2.5" />
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                        {(!bid.enriched_options || bid.enriched_options.length === 0) && (
                          <span className="text-muted-foreground text-xs">No preferences</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    <TableCell>
                      {bid.submitted_at ? new Date(bid.submitted_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleExportPDF(bid)}>
                          <Download className="mr-1 h-3 w-3" />
                          PDF
                        </Button>
                        {bid.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBid(bid)
                                setShowEditDialog(true)
                              }}
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
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
                          </>
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
            <Button variant="destructive" onClick={handleCancelBid} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Bid Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Leave Bid</DialogTitle>
            <DialogDescription>
              Update your leave bid options for {selectedBid?.roster_period_code}. Only pending bids
              can be edited.
            </DialogDescription>
          </DialogHeader>
          {selectedBid && (
            <LeaveBidForm
              isEdit={true}
              initialData={{
                id: selectedBid.id,
                bid_year: getBidYear(selectedBid),
                options: parsePreferredDates(selectedBid),
              }}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Leave Bid Dialog */}
      <Dialog open={showNewBidDialog} onOpenChange={setShowNewBidDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit New Leave Bid</DialogTitle>
            <DialogDescription>
              Select a year and up to 4 preferred date ranges for your leave bid.
            </DialogDescription>
          </DialogHeader>
          <LeaveBidForm onSuccess={handleNewBidSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
