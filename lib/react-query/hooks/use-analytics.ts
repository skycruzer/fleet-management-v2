'use client'

/**
 * Shared TanStack Query hook for /api/analytics.
 *
 * Two pages consume this data — `/dashboard/analytics` and
 * `/dashboard/planning` — and both previously did hand-rolled `useEffect` +
 * `useState` fetching. Routing both through this hook gives us:
 *   - One cached fetch shared across navigations
 *   - Built-in retry / dedup / abort
 *   - A single canonical type for `AnalyticsData`
 *
 * Full visual dedup of the two pages remains out of scope (different layouts);
 * this hook is the prerequisite that makes that follow-up safe.
 */

import { useQuery } from '@tanstack/react-query'

export interface AnalyticsData {
  pilot: {
    total: number
    active: number
    inactive: number
    captains: number
    firstOfficers: number
    retirementPlanning: {
      retiringIn2Years: number
      retiringIn5Years: number
      pilotsRetiringIn2Years: Array<{
        id: string
        name: string
        rank: string
        retirementDate: string
        yearsToRetirement: number
      }>
      pilotsRetiringIn5Years: Array<{
        id: string
        name: string
        rank: string
        retirementDate: string
        yearsToRetirement: number
      }>
    }
  }
  certification: {
    total: number
    current: number
    expiring: number
    expired: number
    complianceRate: number
    categoryBreakdown: Array<{
      category: string
      current: number
      expiring: number
      expired: number
    }>
  }
  leave: {
    total: number
    pending: number
    approved: number
    denied: number
    byType: Array<{ type: string; count: number; totalDays: number }>
  }
  fleet: {
    utilization: number
    availability: number
    readiness: number
    pilotAvailability: { available: number; onLeave: number }
    complianceStatus: { fullyCompliant: number; minorIssues: number; majorIssues: number }
  }
  risk: {
    overallRiskScore: number
    riskFactors: Array<{
      factor: string
      severity: string
      impact: number
      description: string
    }>
    criticalAlerts: Array<{
      id: string
      type: string
      severity: string
      title: string
      description: string
      affectedItems: number
    }>
  }
}

const ANALYTICS_QUERY_KEY = ['fleet-analytics'] as const

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/analytics', { signal })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }
      return result.data as AnalyticsData
    },
    staleTime: 60_000,
  })
}

export const analyticsQueryKey = ANALYTICS_QUERY_KEY
