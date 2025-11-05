/**
 * Admin Leave Bid Review Page
 * Allows administrators to review and approve/reject pilot leave bids
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { LeaveBidReviewTable } from '@/components/admin/leave-bid-review-table'
import { LeaveBidAnnualCalendar } from '@/components/admin/leave-bid-annual-calendar'

export default async function AdminLeaveBidsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Access control: Any authenticated user can access this page
  // Role-based restrictions can be added later when an_users table is populated

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

  // Transform bids to add bid_year derived from leave_bid_options start_date
  const bids = (leaveBids || []).map((bid: any) => {
    // Extract year from first leave bid option start_date
    let bidYear = new Date().getFullYear() + 1 // Default to next year
    if (bid.leave_bid_options && bid.leave_bid_options.length > 0) {
      const firstOption = bid.leave_bid_options[0]
      if (firstOption.start_date) {
        bidYear = new Date(firstOption.start_date).getFullYear()
      }
    }
    return {
      ...bid,
      bid_year: bidYear
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
          <h1 className="text-3xl font-bold text-foreground">Leave Bid Management</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve annual leave bids from pilots
          </p>
        </div>

        {/* PDF Export Button */}
        {bids.length > 0 && (
          <Link
            href={`/api/leave-bids/export-pdf?year=${bidYear}`}
            target="_blank"
          >
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-700">{pendingBids.length}</p>
            </div>
            <div className="text-yellow-500">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        <Card className="border-green-300 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Approved</p>
              <p className="text-3xl font-bold text-green-700">{approvedBids.length}</p>
            </div>
            <div className="text-green-500">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        <Card className="border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Rejected</p>
              <p className="text-3xl font-bold text-red-700">{rejectedBids.length}</p>
            </div>
            <div className="text-red-500">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              className="h-24 w-24 text-gray-300"
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
              <h3 className="text-xl font-semibold text-gray-900">No Leave Bids Yet</h3>
              <p className="mt-2 text-gray-600">
                Pilots haven't submitted any leave bids for review. Leave bids will appear here once pilots submit their annual leave preferences.
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
