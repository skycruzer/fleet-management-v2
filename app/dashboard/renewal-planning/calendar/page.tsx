/**
 * Calendar View Page for Renewal Planning
 *
 * Server component that fetches data and passes to client component.
 * Displays yearly overview of all roster periods with enhanced UI.
 *
 * Features:
 * - Preview modal before exporting/emailing
 * - Filter panel for categories and utilization
 * - Compact and standard view toggles
 * - Hover cards with detailed breakdowns
 */

import {
  getRosterPeriodCapacity,
  getPairingDataForYear,
} from '@/lib/services/certification-renewal-planning-service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { CalendarPageClient } from '@/components/renewal-planning/calendar-page-client'

export const dynamic = 'force-dynamic'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = createServiceRoleClient()

  // Get all roster periods that cover the selected year
  // All 13 periods (RP01-RP13) are now included for planning
  const { data: periods, error } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .gte('period_start_date', `${year}-01-01`)
    .lte('period_start_date', `${year}-12-31`)
    .order('period_start_date')

  if (error) {
    console.error('Error fetching roster periods:', error)
    return []
  }

  if (!periods) return []

  // Get capacity summaries for each period
  const summaries = await Promise.all(
    periods.map(async (p) => {
      const summary = await getRosterPeriodCapacity(p.roster_period)
      return summary
    })
  )

  return summaries.filter((s) => s !== null)
}

export default async function RenewalPlanningCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  // Fetch data in parallel
  const [summaries, pairingData] = await Promise.all([
    getRosterPeriodSummariesForYear(selectedYear),
    getPairingDataForYear(selectedYear),
  ])

  // Calculate if we have any planned renewals
  const totalPlannedRenewals = summaries.reduce((sum, s) => sum + s.totalPlannedRenewals, 0)
  const hasRenewals = totalPlannedRenewals > 0

  return (
    <CalendarPageClient
      year={selectedYear}
      summaries={summaries}
      hasRenewals={hasRenewals}
      totalPlannedRenewals={totalPlannedRenewals}
      pairingData={pairingData}
    />
  )
}
