'use client'

/**
 * Leave Bid Status Card Component
 *
 * Displays pilot's leave bid submissions with status and alerts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

interface LeaveBid {
  id: string
  roster_period_code: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | null
  created_at: string | null
  updated_at: string | null
  leave_bid_options: LeaveBidOption[]
}

interface LeaveBidStatusCardProps {
  bids: LeaveBid[]
}

export function LeaveBidStatusCard({ bids }: LeaveBidStatusCardProps) {
  if (!bids || bids.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
              <Calendar className="text-primary h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Leave Bids</CardTitle>
              <CardDescription>Your annual leave bid submissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No leave bids submitted yet</p>
        </CardContent>
      </Card>
    )
  }

  // Separate approved bids for alerts
  const approvedBids = bids.filter((bid) => bid.status === 'APPROVED')
  const pendingBids = bids.filter((bid) => bid.status === 'PENDING' || bid.status === 'PROCESSING')
  const rejectedBids = bids.filter((bid) => bid.status === 'REJECTED')

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
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
            Not Approved
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityLabel = (priority: number): string => {
    const labels = ['1st Choice', '2nd Choice', '3rd Choice', '4th Choice']
    return labels[priority - 1] || `Option ${priority}`
  }

  return (
    <div className="space-y-4">
      {/* Approved Bids Alert */}
      {approvedBids.length > 0 && (
        <Alert className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)]">
          <CheckCircle className="h-5 w-5 text-[var(--color-status-low)]" />
          <AlertDescription className="ml-2">
            <span className="text-foreground font-semibold">
              Great news! Your leave bid for {approvedBids[0].roster_period_code} has been approved.
            </span>
            <p className="text-muted-foreground mt-1 text-sm">
              Check the details below to see which options were selected.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Leave Bids</CardTitle>
                <CardDescription>Your annual leave bid submissions</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {approvedBids.length > 0 && (
                <Badge className="bg-[var(--color-status-low)]">
                  {approvedBids.length} Approved
                </Badge>
              )}
              {pendingBids.length > 0 && (
                <Badge className="bg-[var(--color-status-medium)]">
                  {pendingBids.length} Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {bids.map((bid) => (
              <div key={bid.id} className="border-border bg-card rounded-lg border-2 p-4 shadow-sm">
                {/* Bid Header */}
                <div className="border-border mb-4 flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-foreground text-lg font-bold">
                      Leave Bid for {bid.roster_period_code}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      {bid.created_at &&
                        `Submitted ${format(new Date(bid.created_at), 'MMM dd, yyyy')}`}
                    </p>
                  </div>
                  {getStatusBadge(bid.status)}
                </div>

                {/* Bid Options */}
                <div className="space-y-3">
                  {bid.leave_bid_options
                    .sort((a, b) => a.priority - b.priority)
                    .map((option) => (
                      <div
                        key={option.id}
                        className="border-border bg-muted flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                            {option.priority}
                          </span>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">
                              {getPriorityLabel(option.priority)}
                            </p>
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
                        </div>

                        {/* Status Indicator for Approved Bids */}
                        {bid.status === 'APPROVED' && option.priority === 1 && (
                          <Badge className="bg-[var(--color-status-low)]">Selected</Badge>
                        )}
                      </div>
                    ))}
                </div>

                {/* Status Message */}
                {bid.status === 'PENDING' && (
                  <div className="mt-4 rounded-md border border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] p-3">
                    <p className="text-sm text-[var(--color-status-medium)]">
                      <AlertTriangle className="mr-1 inline h-4 w-4" />
                      Your bid is pending review by fleet management. You will be notified when a
                      decision is made.
                    </p>
                  </div>
                )}

                {bid.status === 'APPROVED' && (
                  <div className="mt-4 rounded-md border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-3">
                    <p className="text-sm text-[var(--color-status-low)]">
                      <CheckCircle className="mr-1 inline h-4 w-4" />
                      Your bid has been approved! The selected dates are now part of your leave
                      schedule.
                    </p>
                  </div>
                )}

                {bid.status === 'REJECTED' && (
                  <div className="mt-4 rounded-md border border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-3">
                    <p className="text-sm text-[var(--color-status-high)]">
                      <XCircle className="mr-1 inline h-4 w-4" />
                      Your bid could not be approved at this time. Please contact fleet management
                      for more information.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
