/**
 * Planning Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Renewal Planning + Analytics
 * Tabs: Renewal Planning | Analytics
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getRosterPeriodCapacity,
  getRenewalPlansForYear,
  getPairingDataForYear,
} from '@/lib/services/certification-renewal-planning-service'
import { RenewalPlanningDashboard } from '@/components/renewal-planning/renewal-planning-dashboard'
import { RenewalPlanningSkeleton } from '@/components/skeletons/renewal-planning-skeleton'
import { PlanningPageClient } from './planning-page-client'

async function getRosterPeriodSummariesForYear(year: number) {
  const supabase = createServiceRoleClient()

  // Get all roster periods for the selected year
  // Filter by roster_period name (format: RPxx/YYYY) since RP01/YYYY starts in previous year
  const { data: periods, error } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .like('roster_period', `%/${year}`)
    .order('period_start_date')

  if (!periods || error) return []

  // Get capacity summaries for each period
  const summaries = await Promise.all(
    periods.map(async (p) => {
      try {
        return await getRosterPeriodCapacity(p.roster_period)
      } catch (error) {
        console.error(`Failed to get capacity for ${p.roster_period}:`, error)
        return null
      }
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

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; tab?: string }>
}) {
  // Check authentication
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear()
  const activeTab = params.tab || 'renewals'

  // Fetch renewal data server-side
  let summaries: Awaited<ReturnType<typeof getRosterPeriodSummariesForYear>> = []
  let renewalDetails: Awaited<ReturnType<typeof getRenewalDetailsForYear>> = []
  let pairingData: Awaited<ReturnType<typeof getPairingDataForYear>> | undefined = undefined

  try {
    ;[summaries, renewalDetails, pairingData] = await Promise.all([
      getRosterPeriodSummariesForYear(selectedYear),
      getRenewalDetailsForYear(selectedYear),
      getPairingDataForYear(selectedYear),
    ])
  } catch (error) {
    console.error('Failed to load renewal planning data:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Planning</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Certification renewal planning and fleet analytics.
        </p>
      </div>

      <PlanningPageClient activeTab={activeTab}>
        {/* Renewals Tab Content */}
        <div data-tab="renewals">
          <Suspense fallback={<RenewalPlanningSkeleton />}>
            <RenewalPlanningDashboard
              summaries={summaries}
              renewalDetails={renewalDetails}
              pairingData={pairingData}
              selectedYear={selectedYear}
            />
          </Suspense>
        </div>

        {/* Analytics Tab Content - rendered via dynamic import in client */}
        <div data-tab="analytics">{/* AnalyticsContent loaded dynamically */}</div>
      </PlanningPageClient>
    </div>
  )
}
