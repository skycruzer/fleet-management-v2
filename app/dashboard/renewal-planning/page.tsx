/**
 * Renewal Planning Dashboard
 * Main page for viewing and managing certification renewal plans
 *
 * Features:
 * - Timeline view of all 13 roster periods (RP1-RP13)
 * - Year selection to filter roster periods
 * - Category filtering (Flight, Simulator, Ground - Medical excluded)
 * - Capacity indicators
 * - Generate/regenerate planning with Captain/FO pairing
 */

import { Suspense } from 'react'
import { RenewalPlanningDashboard } from '@/components/renewal-planning/renewal-planning-dashboard'
import { RenewalPlanningSkeleton } from '@/components/skeletons/renewal-planning-skeleton'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getRosterPeriodCapacity,
  getRenewalPlansForYear,
} from '@/lib/services/certification-renewal-planning-service'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = createServiceRoleClient()

  // Get all roster periods for the selected year
  // Filter by roster_period name (format: RPxx/YYYY) since RP01/YYYY starts in previous year
  // Example: RP01/2026 starts 2025-12-06, so date-based filtering would miss it

  const { data: periods, error } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .like('roster_period', `%/${year}`) // Match RPxx/YYYY format
    .order('period_start_date')

  if (!periods || error) return []

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

async function RenewalPlanningContent({ selectedYear }: { selectedYear: number }) {
  const [summaries, renewalDetails] = await Promise.all([
    getRosterPeriodSummariesForYear(selectedYear),
    getRenewalDetailsForYear(selectedYear),
  ])
  return (
    <RenewalPlanningDashboard
      summaries={summaries}
      renewalDetails={renewalDetails}
      selectedYear={selectedYear}
    />
  )
}

export default async function RenewalPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()

  return (
    <Suspense fallback={<RenewalPlanningSkeleton />}>
      <RenewalPlanningContent selectedYear={selectedYear} />
    </Suspense>
  )
}
