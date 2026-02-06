/**
 * React Query Hooks for Dashboard Data
 *
 * Hooks for dashboard metrics, stats, and compliance data with intelligent
 * caching strategies based on data criticality.
 * Pauses polling when the browser tab is hidden to save API calls.
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys, queryPresets } from '../query-client'

function useTabVisible() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return visible
}

/**
 * Dashboard Metrics Type
 */
interface DashboardMetrics {
  total_pilots: number
  active_pilots: number
  valid_certifications: number
  total_expired: number
  total_expiring_30_days: number
  total_expiring_60_days: number
  pending_leave: number
  approved_leave: number
  pilots_due_retire_2_years: number
  // ... other metrics
}

/**
 * Compliance Stats Type
 */
interface ComplianceStats {
  compliance_percentage: number
  expired_count: number
  expiring_30_days: number
  expiring_60_days: number
  expiring_90_days: number
}

/**
 * Fetch dashboard metrics
 */
async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch('/api/dashboard/refresh')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics')
  }
  const result = await response.json()
  return result.data
}

/**
 * Fetch compliance stats
 */
async function fetchComplianceStats(): Promise<ComplianceStats> {
  const response = await fetch('/api/analytics')
  if (!response.ok) {
    throw new Error('Failed to fetch compliance stats')
  }
  const result = await response.json()
  return result.compliance || {}
}

/**
 * Hook: Get dashboard metrics
 *
 * Fetches key dashboard metrics with shorter stale time for real-time monitoring.
 * Automatically refetches on window focus to keep data current.
 */
export function useDashboardMetrics() {
  const isTabVisible = useTabVisible()

  return useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: fetchDashboardMetrics,
    ...queryPresets.realtime, // 30 second stale time (real-time critical)
    refetchInterval: isTabVisible ? 5 * 60 * 1000 : false, // Pause when tab hidden
  })
}

/**
 * Hook: Get compliance stats
 *
 * Fetches fleet-wide compliance statistics.
 */
export function useComplianceStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.compliance,
    queryFn: fetchComplianceStats,
    ...queryPresets.realtime, // 30 second stale time
  })
}

/**
 * Hook: Get dashboard stats (combined)
 *
 * Fetches both metrics and compliance stats in parallel.
 *
 * USAGE:
 * ```tsx
 * function Dashboard() {
 *   const metrics = useDashboardMetrics()
 *   const compliance = useComplianceStats()
 *
 *   if (metrics.isLoading || compliance.isLoading) {
 *     return <LoadingSpinner />
 *   }
 *
 *   return (
 *     <div>
 *       <MetricsCard data={metrics.data} />
 *       <ComplianceCard data={compliance.data} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useDashboard() {
  const metrics = useDashboardMetrics()
  const compliance = useComplianceStats()

  return {
    metrics,
    compliance,
    isLoading: metrics.isLoading || compliance.isLoading,
    isError: metrics.isError || compliance.isError,
    error: metrics.error || compliance.error,
  }
}
