import type { DashboardData } from './queries'

/** What the dashboard should render, derived from the (possibly failed) data fetch. */
export type DashboardView =
  | { status: 'error' }
  | {
      status: 'ok'
      currency: DashboardData['currency']
      health: DashboardData['health']
      healthDegraded: boolean
      recent: DashboardData['recent']
    }

/**
 * FIX #2/#8: a fetch ERROR (null sentinel from the page's .catch) maps to status:"error"
 * so the page shows an explicit "unavailable" state. It MUST NEVER fall back to a
 * zero-currency object — during an outage, 0 expired / 0 expiring reads as a compliant
 * fleet, which is a safety hazard. A SUCCESSFUL fetch with genuinely empty data still
 * returns status:"ok" with real zeros/empties (an honest "no data yet", not an error).
 */
export function dashboardView(data: DashboardData | null): DashboardView {
  if (data === null) return { status: 'error' }
  return {
    status: 'ok',
    currency: data.currency,
    health: data.health,
    healthDegraded: data.healthDegraded,
    recent: data.recent,
  }
}
