/**
 * Leave Bid Table Wrapper Component
 *
 * Server component that fetches leave bid data and passes to client component.
 * Maintains separation from unified-request-service while reusing UI patterns.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@/lib/supabase/server'
import { LeaveBidTableClient } from './leave-bid-table-client'
import { getRosterPeriodsForDateRange } from '@/lib/services/roster-period-service'

export interface LeaveBidFilters {
  year?: number
  status?: Array<'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED'>
  pilot_id?: string
  roster_period?: string
}

interface LeaveBidTableWrapperProps {
  searchParams?: {
    year?: string
    status?: string
    pilot_id?: string
    roster_period?: string
  }
}

export async function LeaveBidTableWrapper({ searchParams }: LeaveBidTableWrapperProps) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
        <div className="space-y-3 text-center">
          <p className="text-lg font-medium text-[var(--color-status-high)]">Unauthorized</p>
          <p className="text-muted-foreground text-sm">Please log in to view leave bids</p>
        </div>
      </div>
    )
  }

  // Build query (uses leave_bids table, NOT pilot_requests)
  let query = supabase.from('leave_bids').select(
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

  // Apply filters from searchParams
  if (searchParams) {
    if (searchParams.status) {
      const statuses = searchParams.status.split(',')
      query = query.in('status', statuses)
    }
    if (searchParams.pilot_id) {
      query = query.eq('pilot_id', searchParams.pilot_id)
    }
    if (searchParams.roster_period) {
      query = query.eq('roster_period_code', searchParams.roster_period)
    }
  }

  query = query.order('status', { ascending: true }) // PENDING first
  query = query.order('created_at', { ascending: false })

  const { data: leaveBids, error } = await query

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
        <div className="space-y-3 text-center">
          <p className="text-lg font-medium text-[var(--color-status-high)]">
            Error loading leave bids
          </p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  // Transform bids to add bid_year and roster periods for each option
  const bids = (leaveBids || []).map((bid: any) => {
    let bidYear = new Date().getFullYear() + 1
    if (bid.leave_bid_options && bid.leave_bid_options.length > 0) {
      bidYear = new Date(bid.leave_bid_options[0].start_date).getFullYear()
    }

    // Calculate roster periods for each bid option (server-side)
    const optionsWithRosterPeriods = bid.leave_bid_options.map((option: any) => ({
      ...option,
      roster_periods: getRosterPeriodsForDateRange(option.start_date, option.end_date),
      days_count:
        Math.ceil(
          (new Date(option.end_date).getTime() - new Date(option.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1,
    }))

    return { ...bid, bid_year: bidYear, leave_bid_options: optionsWithRosterPeriods }
  })

  return <LeaveBidTableClient bids={bids} />
}
