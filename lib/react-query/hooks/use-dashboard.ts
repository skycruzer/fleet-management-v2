/**
 * React Query Hooks for Dashboard Data
 *
 * Hooks for dashboard metrics, stats, and compliance data with intelligent
 * caching strategies based on data criticality.
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys, queryPresets } from '../query-client'

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
  return useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: fetchDashboardMetrics,
    ...queryPresets.realtime, // 30 second stale time (real-time critical)
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
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
