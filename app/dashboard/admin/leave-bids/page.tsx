/**
 * Admin Leave Bid Review Page
 * Allows administrators to review and approve/reject pilot leave bids
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { LeaveBidReviewTable } from '@/components/admin/leave-bid-review-table'
import { LeaveBidAnnualCalendar } from '@/components/admin/leave-bid-annual-calendar'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'

export default async function AdminLeaveBidsPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = createAdminClient()

  // Fetch all leave bids with pilot information
  const { data: leaveBids, error } = await supabase
    .from('leave_bids')
    .select(
      `
      id,
      roster_period_code,
      status,
      created_at,
      updated_at,
      pilot_id,
      preferred_dates,
      option_statuses,
      pilots (
        id,
        first_name,
        last_name,
        middle_name,
        employee_id,
        role,
        seniority_number
      ),
      leave_bid_options (
        id,
        priority,
        start_date,
        end_date
      )
    `
    )
    .order('status', { ascending: true }) // PENDING first
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leave bids:', error)
  }

  // Transform bids: normalize leave_bid_options from either the options table
  // or the preferred_dates JSON column (portal submissions use preferred_dates)
  const bids = (leaveBids || []).map((bid: any) => {
    let options = bid.leave_bid_options || []

    // If no options from the table, parse preferred_dates JSON (portal submission format)
    if (options.length === 0 && bid.preferred_dates) {
      try {
        const parsed =
          typeof bid.preferred_dates === 'string'
            ? JSON.parse(bid.preferred_dates)
            : bid.preferred_dates
        if (Array.isArray(parsed)) {
          options = parsed.map((item: any, index: number) => ({
            id: `${bid.id}-opt-${index}`,
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
      roster_periods: getAffectedRosterPeriods(
        new Date(opt.start_date),
        new Date(opt.end_date)
      ).map((rp: any) => rp.code),
    }))

    // Extract year from first option start_date
    let bidYear = new Date().getFullYear() + 1
    if (enrichedOptions.length > 0 && enrichedOptions[0].start_date) {
      bidYear = new Date(enrichedOptions[0].start_date).getFullYear()
    }

    return {
      ...bid,
      leave_bid_options: enrichedOptions,
      bid_year: bidYear,
    }
  })

  // Separate by status
  const pendingBids = bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING')
  const approvedBids = bids.filter((b) => b.status === 'APPROVED')
  const rejectedBids = bids.filter((b) => b.status === 'REJECTED')

  // Calculate year from bids
  const defaultYear = new Date().getFullYear() + 1
  const bidYear = bids.length > 0 ? bids[0].bid_year : defaultYear

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Leave Bid Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve annual leave bids from pilots
          </p>
        </div>

        {/* PDF Export Button */}
        {bids.length > 0 && (
          <Link href={`/api/leave-bids/export-pdf?year=${bidYear}`} target="_blank">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-warning-400)]">Pending Review</p>
              <p className="text-3xl font-bold text-[var(--color-warning-400)]">
                {pendingBids.length}
              </p>
            </div>
            <div className="text-[var(--color-warning-400)]">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-success-400)]">Approved</p>
              <p className="text-3xl font-bold text-[var(--color-success-400)]">
                {approvedBids.length}
              </p>
            </div>
            <div className="text-[var(--color-success-400)]">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-danger-400)]">Rejected</p>
              <p className="text-3xl font-bold text-[var(--color-danger-400)]">
                {rejectedBids.length}
              </p>
            </div>
            <div className="text-[var(--color-danger-400)]">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Empty State when no bids exist */}
      {bids.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg
              className="text-muted-foreground/30 h-24 w-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h3 className="text-foreground text-xl font-semibold">No Leave Bids Yet</h3>
              <p className="text-muted-foreground mt-2">
                Pilots haven't submitted any leave bids for review. Leave bids will appear here once
                pilots submit their annual leave preferences.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs for Table and Calendar Views */}
      {bids.length > 0 && (
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <LeaveBidReviewTable bids={bids} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <LeaveBidAnnualCalendar bids={bids} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
