/**
 * Leave Bid Table Wrapper Component
 *
 * Server component that fetches leave bid data via the service layer and
 * passes the transformed view-model to the client table.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@/lib/supabase/server'
import { LeaveBidTableClient } from './leave-bid-table-client'
import { getRosterPeriodsForDateRange } from '@/lib/services/roster-period-service'
import {
  getAdminLeaveBids,
  type AdminLeaveBidFilters,
  type AdminLeaveBidOption,
} from '@/lib/services/leave-bid-service'

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

  const filters: AdminLeaveBidFilters = {}
  if (searchParams?.status) {
    filters.status = searchParams.status.split(',')
  }
  if (searchParams?.pilot_id) {
    filters.pilot_id = searchParams.pilot_id
  }
  if (searchParams?.roster_period) {
    filters.roster_period = searchParams.roster_period
  }

  const result = await getAdminLeaveBids(filters)

  if (!result.success) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
        <div className="space-y-3 text-center">
          <p className="text-lg font-medium text-[var(--color-status-high)]">
            Error loading leave bids
          </p>
          <p className="text-muted-foreground text-sm">{result.error}</p>
        </div>
      </div>
    )
  }

  const bids = (result.data ?? []).map((bid) => {
    const firstOption = bid.leave_bid_options[0]
    const bidYear = firstOption
      ? new Date(firstOption.start_date).getFullYear()
      : new Date().getFullYear() + 1

    const optionsWithRosterPeriods = bid.leave_bid_options.map((option: AdminLeaveBidOption) => ({
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
