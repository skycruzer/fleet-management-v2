/**
 * Leave Bid Table Client Component
 *
 * Client component for leave bid interactions.
 * Handles view toggle (table/calendar), statistics, and PDF export.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Table } from 'lucide-react'
import { LeaveBidReviewTable } from '@/components/admin/leave-bid-review-table'
import { LeaveBidAnnualCalendar } from '@/components/admin/leave-bid-annual-calendar'
import Link from 'next/link'

interface LeaveBidTableClientProps {
  bids: any[]
}

export function LeaveBidTableClient({ bids }: LeaveBidTableClientProps) {
  const [view, setView] = useState<'table' | 'calendar'>('table')

  // Calculate statistics
  const pendingBids = bids.filter((b) => b.status === 'PENDING' || b.status === 'PROCESSING')
  const approvedBids = bids.filter((b) => b.status === 'APPROVED')
  const rejectedBids = bids.filter((b) => b.status === 'REJECTED')

  // Get bid year from first bid
  const bidYear = bids.length > 0 ? bids[0].bid_year : new Date().getFullYear() + 1

  // Empty state
  if (bids.length === 0) {
    return (
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
              Pilots haven&apos;t submitted any leave bids for review. Leave bids will appear here once
              pilots submit their annual leave preferences.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-700">{pendingBids.length}</p>
            </div>
            <div className="text-yellow-500">
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

        <Card className="border-green-300 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Approved</p>
              <p className="text-3xl font-bold text-green-700">{approvedBids.length}</p>
            </div>
            <div className="text-green-500">
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

        <Card className="border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Rejected</p>
              <p className="text-3xl font-bold text-red-700">{rejectedBids.length}</p>
            </div>
            <div className="text-red-500">
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

      {/* View Toggle + PDF Export */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="table">
              <Table className="h-4 w-4 mr-2" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Link href={`/api/leave-bids/export-pdf?year=${bidYear}`} target="_blank">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </Link>
      </div>

      {/* Content */}
      {view === 'table' ? (
        <LeaveBidReviewTable bids={bids} />
      ) : (
        <LeaveBidAnnualCalendar bids={bids} />
      )}
    </div>
  )
}
