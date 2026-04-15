/**
 * Pilot Leave Bids View Page
 *
 * Allows pilots to view their submitted leave bids and their status.
 * Displays all leave bids with ability to cancel pending bids.
 *
 * @spec Leave bid view functionality
 * @developer Maurice Rondeau
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPilot } from '@/lib/auth/pilot-helpers'
import { getCurrentPilotLeaveBids } from '@/lib/services/leave-bid-service'
import { LeaveBidsClient } from '@/components/portal/leave-bids-client'
import { getAffectedRosterPeriods } from '@/lib/utils/roster-utils'
import { PageHead } from '@/components/ui/page-head'

export const metadata: Metadata = {
  title: 'My Leave Bids | Pilot Portal',
  description: 'View your submitted leave bids and their status',
}

export default async function LeaveBidsPage() {
  // Verify pilot authentication
  const pilot = await getCurrentPilot()
  if (!pilot) {
    redirect('/portal/login')
  }

  // Fetch pilot's leave bids
  const bidsResult = await getCurrentPilotLeaveBids()

  const rawBids = bidsResult.success ? bidsResult.data || [] : []

  // Enrich each bid with roster period codes computed from date ranges
  const leaveBids = rawBids.map((bid) => {
    try {
      const parsed =
        typeof bid.preferred_dates === 'string'
          ? JSON.parse(bid.preferred_dates)
          : bid.preferred_dates
      if (Array.isArray(parsed)) {
        const enrichedOptions = parsed.map((opt: any) => {
          let roster_periods: string[] = []
          if (opt.start_date && opt.end_date) {
            try {
              roster_periods = getAffectedRosterPeriods(
                new Date(opt.start_date),
                new Date(opt.end_date)
              ).map((rp) => rp.code)
            } catch {
              // fallback
            }
          }
          return { ...opt, roster_periods }
        })
        // Collect all unique roster periods across all options
        const allRPs = new Set<string>()
        enrichedOptions.forEach((opt: any) => {
          opt.roster_periods?.forEach((rp: string) => allRPs.add(rp))
        })
        return {
          ...bid,
          enriched_options: enrichedOptions,
          all_roster_periods: Array.from(allRPs).sort(),
          option_statuses: bid.option_statuses || {},
        }
      }
    } catch {
      // Invalid JSON
    }
    return { ...bid, enriched_options: [], all_roster_periods: [] }
  })

  return (
    <div>
      <PageHead
        title="My Leave Bids"
        description="View your submitted leave bids and their approval status"
      />
      <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <LeaveBidsClient initialBids={leaveBids} />
      </main>
    </div>
  )
}
