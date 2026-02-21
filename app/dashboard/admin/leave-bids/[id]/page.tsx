/**
 * Leave Bid View Page
 * Read-only view of a leave bid submission
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User, Briefcase } from 'lucide-react'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import Link from 'next/link'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LeaveBidViewPage({ params }: PageProps) {
  const { id } = await params

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = createAdminClient()

  // Fetch leave bid with all related data
  const { data: rawBid, error } = await supabase
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
      preferred_dates,
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

  if (error || !rawBid) {
    notFound()
  }

  // Normalize options: portal submissions store dates in preferred_dates JSON
  let options = (rawBid as any).leave_bid_options || []
  if (options.length === 0 && (rawBid as any).preferred_dates) {
    try {
      const parsed =
        typeof (rawBid as any).preferred_dates === 'string'
          ? JSON.parse((rawBid as any).preferred_dates)
          : (rawBid as any).preferred_dates
      if (Array.isArray(parsed)) {
        options = parsed.map((item: any, index: number) => ({
          id: `${rawBid.id}-opt-${index}`,
          priority: item.priority || index + 1,
          start_date: item.start_date,
          end_date: item.end_date,
        }))
      }
    } catch {
      // Invalid JSON — leave options empty
    }
  }

  // Enrich each option with roster period codes
  const enrichedOptions = options.map((opt: any) => ({
    ...opt,
    roster_periods: getAffectedRosterPeriods(new Date(opt.start_date), new Date(opt.end_date)).map(
      (rp: any) => rp.code
    ),
  }))

  const bid = { ...rawBid, leave_bid_options: enrichedOptions }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] text-[var(--color-warning-400)]">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] text-[var(--color-info)]">
            <Clock className="mr-1 h-3 w-3" />
            Processing
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] text-[var(--color-success-400)]">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] text-[var(--color-danger-400)]">
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
            <p className="text-muted-foreground text-sm font-medium">Name</p>
            <p className="text-foreground text-base font-semibold">
              {pilot.first_name} {pilot.middle_name ? pilot.middle_name + ' ' : ''}
              {pilot.last_name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Employee ID</p>
            <p className="text-foreground text-base font-semibold">{pilot.employee_id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Rank</p>
            <p className="text-foreground text-base font-semibold">{pilot.role || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Seniority</p>
            <p className="text-foreground text-base font-semibold">
              #{pilot.seniority_number || 'N/A'}
            </p>
          </div>
          {pilot.email && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-sm font-medium">Email</p>
              <p className="text-foreground text-base font-semibold">{pilot.email}</p>
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
              <p className="text-muted-foreground text-sm font-medium">Roster Period</p>
              <p className="text-foreground text-base font-semibold">{bid.roster_period_code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Status</p>
              <div className="mt-1">{getStatusBadge(bid.status)}</div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Submitted</p>
              <p className="text-foreground text-base font-semibold">
                {bid.created_at ? format(new Date(bid.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
          </div>

          {bid.reason && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Reason for Leave</p>
              <p className="text-foreground mt-1 text-base">{bid.reason}</p>
            </div>
          )}

          {bid.notes && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">Additional Notes</p>
              <p className="text-foreground mt-1 text-base">{bid.notes}</p>
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
                  className="bg-card border-border rounded-lg border-2 p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-info-bg)] text-sm font-bold text-[var(--color-info)]">
                      {option.priority}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {option.priority === 1 && '1st Choice'}
                      {option.priority === 2 && '2nd Choice'}
                      {option.priority === 3 && '3rd Choice'}
                      {option.priority > 3 && `${option.priority}th Choice`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Start Date</p>
                      <p className="text-foreground text-base font-semibold">
                        {format(new Date(option.start_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">End Date</p>
                      <p className="text-foreground text-base font-semibold">
                        {format(new Date(option.end_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Duration</p>
                      <p className="text-base font-semibold text-[var(--color-info)]">
                        {Math.ceil(
                          (new Date(option.end_date).getTime() -
                            new Date(option.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{' '}
                        days
                      </p>
                    </div>
                    {option.roster_periods && option.roster_periods.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">Roster Periods</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {option.roster_periods.map((rp: string) => (
                            <Badge
                              key={rp}
                              variant="outline"
                              className="border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-xs text-[var(--color-info)]"
                            >
                              {rp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                <p className="text-muted-foreground text-sm font-medium">Reviewed Date</p>
                <p className="text-foreground text-base font-semibold">
                  {format(new Date(bid.reviewed_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Decision</p>
                <div className="mt-1">{getStatusBadge(bid.status)}</div>
              </div>
            </div>

            {bid.review_comments && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Review Comments</p>
                <p className="text-foreground mt-1 text-base">{bid.review_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
