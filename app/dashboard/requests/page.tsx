/**
 * Unified Requests Dashboard Page
 *
 * Central hub for managing all pilot requests (leave, flight, bids) with
 * comprehensive filtering, status management, and reporting capabilities.
 *
 * Author: Maurice Rondeau
 * Date: November 12, 2025
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DeadlineWidgetWrapper } from '@/components/dashboard/deadline-widget-wrapper'
import { RequestsTableWrapper } from '@/components/requests/requests-table-wrapper'
import { RequestFiltersWrapper } from '@/components/requests/request-filters-wrapper'
import { QuickEntryButton } from '@/components/requests/quick-entry-button'
import { LeaveBidTableWrapper } from '@/components/requests/leave-bid-table-wrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = {
  title: 'Pilot Requests | Fleet Management',
  description: 'Manage all pilot requests in one place',
}

interface PageProps {
  searchParams: Promise<{
    tab?: string
    roster_period?: string
    pilot_id?: string
    status?: string
    category?: string
    channel?: string
    is_late?: string
    is_past_deadline?: string
  }>
}

export default async function RequestsPage({ searchParams: searchParamsPromise }: PageProps) {
  // Await searchParams in Next.js 16
  const searchParams = await searchParamsPromise
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Fetch pilots for quick entry
  const { data: pilotsData } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_id, role, seniority_number')
    .eq('is_active', true)
    .order('seniority_number', { ascending: true })

  // Map pilots to expected type (normalize role to Captain/First Officer)
  // Note: Some pilots may have roles like "Training Captain" which we normalize to "Captain"
  const pilots =
    pilotsData?.map((p) => {
      // Normalize role - treat any captain variant as Captain
      let normalizedRole: 'Captain' | 'First Officer' = 'First Officer'
      if (p.role === 'Captain' || (p.role as string).includes('Captain')) {
        normalizedRole = 'Captain'
      }

      return {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        employee_id: p.employee_id,
        role: normalizedRole,
        seniority_number: p.seniority_number,
      }
    }) || []

  // Determine active tab from URL
  const activeTab = searchParams.tab || 'leave'

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pilot Requests</h1>
          <p className="text-muted-foreground">
            Manage leave requests, flight requests, and leave bids
          </p>
        </div>
        <QuickEntryButton pilots={pilots} />
      </div>

      {/* Deadline Widget */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <DeadlineWidgetWrapper maxPeriods={3} />
      </Suspense>

      {/* Tabs */}
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="leave" asChild>
            <a href="/dashboard/requests?tab=leave">Leave Requests</a>
          </TabsTrigger>
          <TabsTrigger value="flight" asChild>
            <a href="/dashboard/requests?tab=flight">Flight Requests</a>
          </TabsTrigger>
          <TabsTrigger value="bids" asChild>
            <a href="/dashboard/requests?tab=bids">Leave Bids</a>
          </TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="space-y-6 mt-6">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <RequestFiltersWrapper searchParams={{ ...searchParams, category: 'LEAVE' as const }} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <RequestsTableWrapper searchParams={{ ...searchParams, category: 'LEAVE' as const }} />
          </Suspense>
        </TabsContent>

        {/* Flight Requests Tab */}
        <TabsContent value="flight" className="space-y-6 mt-6">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <RequestFiltersWrapper searchParams={{ ...searchParams, category: 'FLIGHT' as const }} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <RequestsTableWrapper searchParams={{ ...searchParams, category: 'FLIGHT' as const }} />
          </Suspense>
        </TabsContent>

        {/* Leave Bids Tab */}
        <TabsContent value="bids" className="space-y-6 mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <LeaveBidTableWrapper searchParams={searchParams} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
