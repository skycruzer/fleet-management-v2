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
import { getRosterPeriodCapacity } from '@/lib/services/certification-renewal-planning-service'
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

  // Fetch renewal summaries server-side
  let summaries: Awaited<ReturnType<typeof getRosterPeriodSummariesForYear>> = []
  try {
    summaries = await getRosterPeriodSummariesForYear(selectedYear)
  } catch (error) {
    console.error('Failed to load roster period summaries:', error)
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
            <RenewalPlanningDashboard summaries={summaries} selectedYear={selectedYear} />
          </Suspense>
        </div>

        {/* Analytics Tab Content - rendered via dynamic import in client */}
        <div data-tab="analytics">{/* AnalyticsContent loaded dynamically */}</div>
      </PlanningPageClient>
    </div>
  )
}
