/**
 * Sidebar Badges Service
 *
 * Counts for the admin sidebar badges (pending requests, expiring/expired certs).
 * Queries are aggregation-only (count-head) so they're cheap.
 *
 * Returns a discriminated success/degraded shape so the UI can distinguish
 * "no items to action" from "we couldn't load this" — silently rendering 0
 * during a DB failure would mask real operational backlog from admins.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export interface SidebarBadgeCounts {
  pendingRequests: number
  expiredCertifications: number
  expiringCertifications: number
}

export type SidebarBadgesResult =
  | ({ degraded: false } & SidebarBadgeCounts)
  | ({ degraded: true; failures: string[] } & SidebarBadgeCounts)

export async function getSidebarBadgeCounts(): Promise<SidebarBadgesResult> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const expiryThreshold = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [pendingResult, expiredResult, expiringResult] = await Promise.all([
    supabase
      .from('pilot_requests')
      .select('id', { count: 'exact', head: true })
      .in('workflow_status', ['SUBMITTED', 'IN_REVIEW']),

    supabase
      .from('pilot_checks')
      .select('id', { count: 'exact', head: true })
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today),

    supabase
      .from('pilot_checks')
      .select('id', { count: 'exact', head: true })
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today)
      .lte('expiry_date', expiryThreshold),
  ])

  const failures: string[] = []
  if (pendingResult.error) {
    failures.push('pendingRequests')
    logError(new Error(pendingResult.error.message), {
      source: 'sidebar-badges-service:pendingRequests',
      severity: ErrorSeverity.MEDIUM,
      metadata: { code: pendingResult.error.code },
    })
  }
  if (expiredResult.error) {
    failures.push('expiredCertifications')
    logError(new Error(expiredResult.error.message), {
      source: 'sidebar-badges-service:expiredCertifications',
      severity: ErrorSeverity.MEDIUM,
      metadata: { code: expiredResult.error.code },
    })
  }
  if (expiringResult.error) {
    failures.push('expiringCertifications')
    logError(new Error(expiringResult.error.message), {
      source: 'sidebar-badges-service:expiringCertifications',
      severity: ErrorSeverity.MEDIUM,
      metadata: { code: expiringResult.error.code },
    })
  }

  const counts: SidebarBadgeCounts = {
    pendingRequests: pendingResult.count ?? 0,
    expiredCertifications: expiredResult.count ?? 0,
    expiringCertifications: expiringResult.count ?? 0,
  }

  if (failures.length > 0) {
    return { degraded: true, failures, ...counts }
  }
  return { degraded: false, ...counts }
}
