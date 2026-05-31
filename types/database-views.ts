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
  current_certifications: number
  expiring_certifications: number
  expired_certifications: number
  expiring_this_week: number
  compliance_rate: number

  // Leave Metrics
  pending_leave: number
  approved_leave: number
  denied_leave: number
  leave_this_month: number

  // Alert Counts (mirror cert counts; kept for callers reading alert.* fields)
  critical_alerts: number
  warning_alerts: number

  // Retirement Metrics
  overdue_retirement: number
  retirement_due_soon: number
  pilots_nearing_retirement: number

  // Category Compliance (JSONB)
  category_compliance: Json

  // Metadata
  last_refreshed: string
  schema_version: string
}

/**
 * Historical Retirement Trends Materialized View
 *
 * Tracks retirement trends by year for workforce planning
 */
export interface HistoricalRetirementTrends {
  year: number
  captain_retirements: number
  first_officer_retirements: number
  total_retirements: number
  avg_retirement_age: number
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
