/**
 * Leave Bid View Page
 * Read-only view of a leave bid submission
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveBidViewPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch leave bid with all related data
  const { data: bid, error } = await supabase
    .from('leave_bids')
    .select(
      `
      id,
      roster_period_code,
      status,
      created_at,
      updated_at,
      reviewed_at,
      review_comments,
      notes,
      reason,
      pilot_id,
      pilots (
        id,
        first_name,
        last_name,
        middle_name,
        employee_id,
        role,
        seniority_number,
        email
      ),
      leave_bid_options (
        id,
        priority,
        start_date,
        end_date
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !bid) {
    notFound()
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="border-blue-300 bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="border-green-300 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="border-red-300 bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const pilot = bid.pilots as any

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/leave-bids">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leave Bids
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-3xl font-bold">Leave Bid Details</h1>
            <p className="text-muted-foreground">
              Submitted {bid.created_at ? format(new Date(bid.created_at), 'MMMM dd, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {getStatusBadge(bid.status)}
          <Link href={`/dashboard/admin/leave-bids/${id}/edit`}>
            <Button variant="default" size="sm">
              Edit Bid
            </Button>
          </Link>
        </div>
      </div>

      {/* Pilot Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pilot Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-base font-semibold text-gray-900">
              {pilot.first_name} {pilot.middle_name ? pilot.middle_name + ' ' : ''}
              {pilot.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Employee ID</p>
            <p className="text-base font-semibold text-gray-900">{pilot.employee_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rank</p>
            <p className="text-base font-semibold text-gray-900">{pilot.role || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Seniority</p>
            <p className="text-base font-semibold text-gray-900">
              #{pilot.seniority_number || 'N/A'}
            </p>
          </div>
          {pilot.email && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base font-semibold text-gray-900">{pilot.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Bid Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Roster Period</p>
              <p className="text-base font-semibold text-gray-900">{bid.roster_period_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(bid.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Submitted</p>
              <p className="text-base font-semibold text-gray-900">
                {bid.created_at ? format(new Date(bid.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
          </div>

          {bid.reason && (
            <div>
              <p className="text-sm font-medium text-gray-500">Reason for Leave</p>
              <p className="mt-1 text-base text-gray-900">{bid.reason}</p>
            </div>
          )}

          {bid.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500">Additional Notes</p>
              <p className="mt-1 text-base text-gray-900">{bid.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {bid.leave_bid_options
              .sort((a: any, b: any) => a.priority - b.priority)
              .map((option: any) => (
                <div
                  key={option.id}
                  className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-900">
                      {option.priority}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {option.priority === 1 && '1st Choice'}
                      {option.priority === 2 && '2nd Choice'}
                      {option.priority === 3 && '3rd Choice'}
                      {option.priority > 3 && `${option.priority}th Choice`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Start Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {format(new Date(option.start_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">End Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {format(new Date(option.end_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Duration</p>
                      <p className="text-base font-semibold text-cyan-700">
                        {Math.ceil(
                          (new Date(option.end_date).getTime() -
                            new Date(option.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{' '}
                        days
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Information (if reviewed) */}
      {bid.reviewed_at && (
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Reviewed Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {format(new Date(bid.reviewed_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Decision</p>
                <div className="mt-1">{getStatusBadge(bid.status)}</div>
              </div>
            </div>

            {bid.review_comments && (
              <div>
                <p className="text-sm font-medium text-gray-500">Review Comments</p>
                <p className="mt-1 text-base text-gray-900">{bid.review_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
