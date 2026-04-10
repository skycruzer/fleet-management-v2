/**
 * Leave Management Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Leave Approvals, Leave Calendar, Leave Bids
 * Tabs: Pending Approvals | Calendar | Leave Bids
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { getAllLeaveRequests } from '@/lib/services/unified-request-service'
import { LeavePageClient } from './leave-page-client'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

async function getLeaveData() {
  const supabase = await createClient()

  // Fetch pending leave requests for approvals tab
  const { data: pendingRequests } = await supabase
    .from('pilot_requests')
    .select(
      `
      id,
      pilot_id,
      employee_number,
      name,
      rank,
      request_type,
      start_date,
      end_date,
      roster_period,
      workflow_status,
      reason,
      notes,
      is_late_request,
      is_past_deadline,
      created_at,
      conflict_flags,
      availability_impact,
      pilots (seniority_number)
    `
    )
    .eq('request_category', 'LEAVE')
    .in('workflow_status', ['SUBMITTED', 'IN_REVIEW', 'PENDING'])
    .order('is_late_request', { ascending: false })
    .order('created_at', { ascending: true })

  // Fetch all leave requests for calendar tab
  const leaveRequestsResult = await getAllLeaveRequests()
  const allLeaveRequests = leaveRequestsResult.data ?? []

  // Fetch pilot counts for calendar
  const { count: totalCaptains } = await supabase
    .from('pilots')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Captain')

  const { count: totalFirstOfficers } = await supabase
    .from('pilots')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'First Officer')

  // Fetch leave bids for bids tab
  const { data: leaveBids } = await supabase
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
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    pendingRequests: pendingRequests || [],
    allLeaveRequests,
    totalCaptains: totalCaptains || 14,
    totalFirstOfficers: totalFirstOfficers || 13,
    leaveBids: leaveBids || [],
  }
}

function LeavePageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </Card>
    </div>
  )
}

export default async function LeaveManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const activeTab = params.tab || 'approvals'

  // Fetch all leave data server-side
  const { pendingRequests, allLeaveRequests, totalCaptains, totalFirstOfficers, leaveBids } =
    await getLeaveData()

  // Transform pending requests for LeaveApprovalClient
  const transformedPendingRequests = pendingRequests.map((request) => ({
    id: request.id,
    pilot_name: request.name || 'Unknown Pilot',
    employee_id: request.employee_number || 'N/A',
    pilot_role: request.rank as 'Captain' | 'First Officer' | null,
    request_type: request.request_type as
      | 'RDO'
      | 'SDO'
      | 'ANNUAL'
      | 'SICK'
      | 'LSL'
      | 'LWOP'
      | 'MATERNITY'
      | 'COMPASSIONATE'
      | null,
    start_date: request.start_date || '',
    end_date: request.end_date || '',
    days_count: calculateDays(request.start_date, request.end_date),
    roster_period: request.roster_period || '',
    status: mapWorkflowStatus(request.workflow_status),
    reason: request.reason,
    created_at: request.created_at,
    is_late_request: request.is_late_request,
  }))

  // Transform leave bids with proper status type casting
  const transformedLeaveBids = leaveBids.map((bid: LeadBidData) => ({
    ...bid,
    // Cast status to expected enum type (validated at DB level)
    status: bid.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | null,
    bid_year: extractBidYear(bid.leave_bid_options),
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Leave Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review leave requests, view the calendar, and manage leave bids.
        </p>
      </div>

      <Suspense fallback={<LeavePageSkeleton />}>
        <LeavePageClient
          activeTab={activeTab}
          pendingRequests={transformedPendingRequests}
          allLeaveRequests={allLeaveRequests}
          totalCaptains={totalCaptains}
          totalFirstOfficers={totalFirstOfficers}
          leaveBids={transformedLeaveBids}
        />
      </Suspense>
    </div>
  )
}

// Helper functions
function calculateDays(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function mapWorkflowStatus(status: string | null): 'PENDING' | 'APPROVED' | 'DENIED' {
  switch (status) {
    case 'APPROVED':
      return 'APPROVED'
    case 'DENIED':
      return 'DENIED'
    default:
      return 'PENDING'
  }
}

interface LeaveBidOption {
  id: string
  priority: number
  start_date: string
  end_date: string
}

interface LeadBidData {
  id: string
  roster_period_code: string
  status: string | null
  created_at: string | null
  updated_at: string | null
  pilot_id: string
  pilots: {
    id: string
    first_name: string
    last_name: string
    middle_name: string | null
    employee_id: string | null
    role: string | null
    seniority_number: number | null
  }
  leave_bid_options: LeaveBidOption[]
}

function extractBidYear(options: LeaveBidOption[] | null): number {
  const defaultYear = new Date().getFullYear() + 1
  if (!options || options.length === 0) return defaultYear
  const firstOption = options[0]
  if (firstOption.start_date) {
    return new Date(firstOption.start_date).getFullYear()
  }
  return defaultYear
}
