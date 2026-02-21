/**
 * Unified Request Management Dashboard
 *
 * Central hub for managing all pilot requests (leave, flight) with
 * multiple view modes: Table, Cards, and Calendar.
 *
 * Author: Maurice Rondeau
 * Date: December 20, 2025 (Refactored for unified view modes)
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import {
  getAllPilotRequests,
  updateRequestStatus,
  deletePilotRequest,
} from '@/lib/services/unified-request-service'
import { invalidateAfterMutation } from '@/lib/services/cache-invalidation-helper'
import { DeadlineWidgetWrapper } from '@/components/dashboard/deadline-widget-wrapper'
import { RequestsTableWrapper } from '@/components/requests/requests-table-wrapper'
import { RequestFiltersWrapper } from '@/components/requests/request-filters-wrapper'
import { QuickEntryButton } from '@/components/requests/quick-entry-button'
import { ViewModeToggle, type ViewMode } from '@/components/requests/view-mode-toggle'
import { StatsOverview } from '@/components/requests/stats-overview'
import { RequestCardsGrid } from '@/components/requests/request-cards-grid'
import { LeaveCalendarClient } from '@/app/dashboard/leave/calendar/leave-calendar-client'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateRequestStats } from '@/lib/utils/request-stats-utils'

export const metadata = {
  title: 'Request Management | Fleet Management',
  description: 'Manage all pilot requests with Table, Cards, and Calendar views',
}

interface PageProps {
  searchParams: Promise<{
    view?: string
    tab?: string
    roster_period?: string
    pilot_id?: string
    status?: string
    category?: string
    channel?: string
    is_late?: string
    is_past_deadline?: string
    stat_filter?: string
    month?: string
  }>
}

export default async function RequestsPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise

  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Parse URL parameters
  const viewMode = (searchParams.view as ViewMode) || 'table'
  const activeTab = searchParams.tab || 'leave'
  const category = activeTab === 'flight' ? 'FLIGHT' : 'LEAVE'

  // Fetch pilots for quick entry
  const { data: pilotsData } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_id, role, seniority_number')
    .eq('is_active', true)
    .order('seniority_number', { ascending: true })

  const pilots =
    pilotsData?.map((p) => {
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

  // Fetch requests for stats and cards/calendar views
  const requestsResponse = await getAllPilotRequests({
    request_category: category === 'FLIGHT' ? ['FLIGHT'] : ['LEAVE'],
  })

  // Extract requests data (empty array if service failed)
  const requests = requestsResponse.success && requestsResponse.data ? requestsResponse.data : []

  // Calculate stats
  const stats = calculateRequestStats(requests)

  // Get crew counts for calendar
  const captainCount = pilots.filter((p) => p.role === 'Captain').length
  const foCount = pilots.filter((p) => p.role === 'First Officer').length

  // Filter requests for cards view based on URL params (or default to pending)
  const filteredRequests = requests.filter((r) => {
    // Filter by status (if provided, else default to pending)
    if (searchParams.status) {
      const statuses = searchParams.status.split(',')
      if (!statuses.includes(r.workflow_status)) return false
    } else {
      // Default to pending if no status filter specified
      if (!['SUBMITTED', 'IN_REVIEW'].includes(r.workflow_status)) return false
    }

    // Filter by roster period
    if (searchParams.roster_period && r.roster_period !== searchParams.roster_period) {
      return false
    }

    // Filter by channel
    if (searchParams.channel && r.submission_channel !== searchParams.channel) {
      return false
    }

    // Filter by late flag
    if (searchParams.is_late === 'true' && !r.is_late_request) return false

    // Filter by past deadline flag
    if (searchParams.is_past_deadline === 'true' && !r.is_past_deadline) return false

    return true
  })

  // Server actions for approve/deny
  async function handleApprove(id: string) {
    'use server'
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      throw new Error('Unauthorized')
    }

    const result = await updateRequestStatus(id, 'APPROVED', auth.userId!)
    if (!result.success) {
      throw new Error(result.error || 'Failed to approve request')
    }

    await invalidateAfterMutation('leave', { resourceId: id })
  }

  async function handleDeny(id: string) {
    'use server'
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      throw new Error('Unauthorized')
    }

    const result = await updateRequestStatus(id, 'DENIED', auth.userId!, 'Denied by admin')
    if (!result.success) {
      throw new Error(result.error || 'Failed to deny request')
    }

    await invalidateAfterMutation('leave', { resourceId: id })
  }

  async function handleDelete(id: string) {
    'use server'
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      throw new Error('Unauthorized')
    }

    const result = await deletePilotRequest(id)
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete request')
    }

    await invalidateAfterMutation('leave', { resourceId: id })
  }

  return (
    <div className="w-full space-y-4 px-4 py-4 lg:px-6">
      {/* Header - Linear-inspired: compact, clean */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Request Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage leave and flight requests with Table, Cards, or Calendar views
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle currentView={viewMode} />
          <QuickEntryButton pilots={pilots} />
        </div>
      </div>

      {/* Stats Overview - clickable cards filter the table */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <StatsOverview stats={stats} />
      </Suspense>

      {/* Deadline Widget (collapsible in table view) */}
      {viewMode === 'table' && (
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <DeadlineWidgetWrapper maxPeriods={1} />
        </Suspense>
      )}

      {/* Category Tabs */}
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leave" asChild>
            <Link href={`/dashboard/requests?tab=leave&view=${viewMode}`}>Leave Requests</Link>
          </TabsTrigger>
          <TabsTrigger value="flight" asChild>
            <Link href={`/dashboard/requests?tab=flight&view=${viewMode}`}>RDO/SDO Requests</Link>
          </TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="mt-4 space-y-4">
          {viewMode === 'table' && (
            <>
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <RequestFiltersWrapper />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <RequestsTableWrapper
                  searchParams={Promise.resolve({
                    roster_period: searchParams.roster_period,
                    pilot_id: searchParams.pilot_id,
                    status: searchParams.status,
                    category: 'LEAVE',
                    channel: searchParams.channel,
                    is_late: searchParams.is_late,
                    is_past_deadline: searchParams.is_past_deadline,
                  })}
                />
              </Suspense>
            </>
          )}

          {viewMode === 'cards' && (
            <>
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <RequestFiltersWrapper />
              </Suspense>
              <RequestCardsGrid
                requests={filteredRequests.filter((r) => r.request_category === 'LEAVE')}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDelete={handleDelete}
              />
            </>
          )}

          {viewMode === 'calendar' && (
            <LeaveCalendarClient
              leaveRequests={requests}
              totalCaptains={captainCount}
              totalFirstOfficers={foCount}
            />
          )}
        </TabsContent>

        {/* Flight Requests Tab */}
        <TabsContent value="flight" className="mt-4 space-y-4">
          {viewMode === 'table' && (
            <>
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <RequestFiltersWrapper />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <RequestsTableWrapper
                  searchParams={Promise.resolve({
                    roster_period: searchParams.roster_period,
                    pilot_id: searchParams.pilot_id,
                    status: searchParams.status,
                    category: 'FLIGHT',
                    channel: searchParams.channel,
                    is_late: searchParams.is_late,
                    is_past_deadline: searchParams.is_past_deadline,
                  })}
                />
              </Suspense>
            </>
          )}

          {viewMode === 'cards' && (
            <>
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <RequestFiltersWrapper />
              </Suspense>
              <RequestCardsGrid
                requests={filteredRequests.filter((r) => r.request_category === 'FLIGHT')}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onDelete={handleDelete}
              />
            </>
          )}

          {viewMode === 'calendar' && (
            <LeaveCalendarClient
              leaveRequests={requests}
              totalCaptains={captainCount}
              totalFirstOfficers={foCount}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Link to Leave Bids (separate page) - Linear-inspired link style */}
      <div className="border-border/50 border-t pt-4">
        <Link
          href="/dashboard/admin/leave-bids"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
        >
          Manage Leave Bids (Annual Planning) →
        </Link>
      </div>
    </div>
  )
}
