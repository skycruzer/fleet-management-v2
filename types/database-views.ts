/**
 * Custom Database Views Type Definitions
 *
 * Materialized views and custom views not included in Supabase generated types
 *
 * @created 2025-10-29
 */

import { Json } from './supabase'

/**
 * Pilot Dashboard Metrics Materialized View
 *
 * Performance-optimized materialized view for dashboard metrics
 * Refresh using: SELECT refresh_dashboard_metrics()
 */
export interface PilotDashboardMetrics {
  // Pilot Metrics
  total_pilots: number
  active_pilots: number
  total_captains: number
  total_first_officers: number
  training_captains: number
  examiners: number

  // Certification Metrics
  total_certifications: number
  valid_certifications: number
  expiring_soon_certifications: number
  expired_certifications: number
  compliance_rate: number

  // Leave Metrics
  pending_leave: number
  approved_leave: number
  rejected_leave: number

  // Alert Metrics
  total_expired: number
  total_expiring_30_days: number

  // Retirement Metrics
  pilots_nearing_retirement: number
  pilots_due_retire_2_years: number

  // Metadata
  last_refreshed: string

  // Category Compliance (JSONB)
  category_compliance: Json
}

/**
 * Type guard to check if data is PilotDashboardMetrics
 */
export function isPilotDashboardMetrics(data: any): data is PilotDashboardMetrics {
  return (
    data &&
    typeof data.total_pilots === 'number' &&
    typeof data.active_pilots === 'number' &&
    typeof data.last_refreshed === 'string'
  )
}
