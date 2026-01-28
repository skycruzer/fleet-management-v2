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
import { RenewalPlanningSkeleton } from '@/components/skeletons'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

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

async function RenewalPlanningContent({ selectedYear }: { selectedYear: number }) {
  const summaries = await getRosterPeriodSummariesForYear(selectedYear)
  return <RenewalPlanningDashboard summaries={summaries} selectedYear={selectedYear} />
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
