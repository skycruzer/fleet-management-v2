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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Leave Bids</CardTitle>
              <CardDescription>
                Your annual leave bid submissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No leave bids submitted yet</p>
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
          <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
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
        <Alert className="border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertDescription className="ml-2">
            <span className="font-semibold text-green-900 dark:text-green-100">
              Great news! Your leave bid for {approvedBids[0].roster_period_code} has been approved.
            </span>
            <p className="mt-1 text-sm text-green-700 dark:text-green-200">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Leave Bids</CardTitle>
                <CardDescription>
                  Your annual leave bid submissions
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {approvedBids.length > 0 && (
                <Badge className="bg-green-500">{approvedBids.length} Approved</Badge>
              )}
              {pendingBids.length > 0 && (
                <Badge className="bg-yellow-500">{pendingBids.length} Pending</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Bid Header */}
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Leave Bid for {bid.roster_period_code}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {bid.created_at && `Submitted ${format(new Date(bid.created_at), 'MMM dd, yyyy')}`}
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
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-900">
                            {option.priority}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              {getPriorityLabel(option.priority)}
                            </p>
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
                        </div>

                        {/* Status Indicator for Approved Bids */}
                        {bid.status === 'APPROVED' && option.priority === 1 && (
                          <Badge className="bg-green-600">
                            Selected
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>

                {/* Status Message */}
                {bid.status === 'PENDING' && (
                  <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="mr-1 inline h-4 w-4" />
                      Your bid is pending review by fleet management. You will be notified when a
                      decision is made.
                    </p>
                  </div>
                )}

                {bid.status === 'APPROVED' && (
                  <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="mr-1 inline h-4 w-4" />
                      Your bid has been approved! The selected dates are now part of your leave
                      schedule.
                    </p>
                  </div>
                )}

                {bid.status === 'REJECTED' && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-800">
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
