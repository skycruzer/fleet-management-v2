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
  getRenewalPlansForYear,
} from '@/lib/services/certification-renewal-planning-service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { CalendarPageClient } from '@/components/renewal-planning/calendar-page-client'

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

async function getRenewalDetailsForYear(year: number) {
  const plans = await getRenewalPlansForYear(year)
  return plans.map((r) => ({
    id: r.id,
    pilot_name: r.pilot ? `${r.pilot.first_name} ${r.pilot.last_name}` : 'Unknown',
    employee_id: r.pilot?.employee_id || '',
    check_code: r.check_type?.check_code || '',
    category: r.check_type?.category || '',
    planned_renewal_date: r.planned_renewal_date || '',
    original_expiry_date: r.original_expiry_date || '',
    renewal_window_start: r.renewal_window_start || '',
    renewal_window_end: r.renewal_window_end || '',
    roster_period: r.planned_roster_period || '',
    pairing_status: r.pairing_status ?? undefined,
    paired_pilot_name: r.paired_pilot
      ? `${r.paired_pilot.first_name} ${r.paired_pilot.last_name}`
      : undefined,
  }))
}

export default async function RenewalPlanningCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  // Fetch data in parallel
  const [summaries, pairingData, renewalDetails] = await Promise.all([
    getRosterPeriodSummariesForYear(selectedYear),
    getPairingDataForYear(selectedYear),
    getRenewalDetailsForYear(selectedYear),
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
      renewalDetails={renewalDetails}
    />
  )
}
