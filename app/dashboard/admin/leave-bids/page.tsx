/**
 * Admin Leave Bid Review Page
 * Allows administrators to review and approve/reject pilot leave bids
 */

import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { LeaveBidReviewTable } from '@/components/admin/leave-bid-review-table'
import { LeaveBidAnnualCalendar } from '@/components/admin/leave-bid-annual-calendar'
import { getLeaveBidsForAdmin } from '@/lib/services/leave-bid-service'

export default async function AdminLeaveBidsPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch all leave bids (pilot info joined, options normalized) via service layer
  const result = await getLeaveBidsForAdmin()
  if (!result.success) {
    console.error('Error fetching leave bids:', result.error)
  }

  // Component prop interfaces are narrower than the nullable DB row types;
  // this page previously built the list untyped — cast preserves that contract.
  const bids = (result.data ?? []) as any[]

  // Separate by status
  const pendingBids = bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING')
  const approvedBids = bids.filter((b) => b.status === 'APPROVED')
  const rejectedBids = bids.filter((b) => b.status === 'REJECTED')

  // Calculate year from bids
  const defaultYear = new Date().getFullYear() + 1
  const bidYear = bids.length > 0 ? bids[0].bid_year : defaultYear

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leave Bid Management"
        description="Review and approve annual leave bids from pilots"
        actions={
          bids.length > 0 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/api/leave-bids/export-pdf?year=${bidYear}`} target="_blank">
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Statistics (hidden when there are no bids — the empty state owns the page) */}
      {bids.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-warning-muted-foreground)]">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-[var(--color-warning-muted-foreground)]">
                  {pendingBids.length}
                </p>
              </div>
              <div className="text-[var(--color-warning-muted-foreground)]">
                <Clock className="h-12 w-12" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-success-muted-foreground)]">
                  Approved
                </p>
                <p className="text-3xl font-bold text-[var(--color-success-muted-foreground)]">
                  {approvedBids.length}
                </p>
              </div>
              <div className="text-[var(--color-success-muted-foreground)]">
                <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <Card className="border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-destructive-muted-foreground)]">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-[var(--color-destructive-muted-foreground)]">
                  {rejectedBids.length}
                </p>
              </div>
              <div className="text-[var(--color-destructive-muted-foreground)]">
                <XCircle className="h-12 w-12" aria-hidden="true" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State when no bids exist */}
      {bids.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <FileText
              className="text-muted-foreground/30 h-24 w-24"
              strokeWidth={1.5}
              aria-hidden="true"
            />
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
