/**
 * Renewal Planning Dashboard
 * Main page for viewing and managing certification renewal plans
 *
 * Features:
 * - Timeline view of 13 roster periods
 * - Year selection to filter roster periods
 * - Category filtering
 * - Capacity indicators
 * - Generate/regenerate planning
 * - Excludes December and January from renewal scheduling
 */

import { Suspense } from 'react'
import { RenewalPlanningDashboard } from '@/components/renewal-planning/renewal-planning-dashboard'
import { RenewalPlanningSkeleton } from '@/components/skeletons'
import { createClient } from '@/lib/supabase/server'
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'

export const dynamic = 'force-dynamic'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = await createClient()

  // Get roster periods that cover the selected year
  // For 2026: Get RP03/2026 through RP13/2026 (February through November)
  // Exclude: RP13/YYYY (Dec), RP01/(YYYY+1) (Jan), RP02/(YYYY+1) (Jan-Feb)

  const { data: periods } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .gte('period_start_date', `${year}-02-01`) // Start from February
    .lte('period_start_date', `${year}-11-30`) // End in November
    .order('period_start_date')

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
